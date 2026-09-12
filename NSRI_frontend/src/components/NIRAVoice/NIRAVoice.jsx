import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sendChatMessage } from '../../services/chatService';
import { createSnapshot, getSnapshots } from '../../services/snapshotService';
import './NIRAVoice.css';

const SUGGESTED_VOICE_QUERIES = [
  "Hey NIRA, what's my current NSRI?",
  "Hey NIRA, give me my recovery report.",
  "Hey NIRA, why is my score high?",
  "Hey NIRA, am I recovering?",
  "Hey NIRA, what is affecting my score?",
  "Hey NIRA, what should I do now?",
  "Hey NIRA, save this as a snapshot.",
  "Hey NIRA, compare my current state with my last snapshot.",
  "Hey NIRA, generate my report."
];

const NIRAVoice = ({ nsriData = null, onSnapshotSaved = null }) => {
  // Voice interaction states: 'idle' | 'listening' | 'processing' | 'speaking'
  const [voiceState, setVoiceState] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [permissionError, setPermissionError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);

  // References for persistent lifecycle management
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const isProcessingRef = useRef(false);
  const finalTranscriptRef = useRef('');
  const currentFullTranscriptRef = useRef('');
  const silenceTimerRef = useRef(null);
  const restartTimeoutRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis || null);
  const handleFinalizeAndProcessRef = useRef(null);
  const processVoiceIntentRef = useRef(null);

  // Telemetry metrics
  const hasData = nsriData !== null && (nsriData.nsri !== undefined || nsriData.nsri_score !== undefined || nsriData.composite_nsri !== undefined);
  const score = hasData ? Math.round(nsriData.nsri ?? nsriData.nsri_score ?? nsriData.composite_nsri ?? 0) : 54;
  const state = hasData ? (nsriData.state ?? nsriData.nsri_state ?? 'Strained') : 'Strained';
  const sai = hasData ? Math.round(nsriData.sai ?? 58) : 58;
  const pri = hasData ? Math.round(nsriData.pri ?? 41) : 41;
  const rdt = hasData ? Math.round(nsriData.rdt ?? 48) : 48;
  const hr = hasData ? Math.round(nsriData.heart_rate ?? nsriData.Mean_HR ?? 86) : 86;
  const hrv = hasData ? Math.round(nsriData.hrv ?? nsriData.RMSSD ?? 32) : 32;
  const recoverySignal = score <= 20 ? 'Optimal' : score <= 40 ? 'Stable' : score <= 60 ? 'Declining' : 'Depleted';

  // Always keep latest props and state accessible in callbacks without recreating listeners
  const latestDataRef = useRef({
    score,
    state,
    sai,
    pri,
    rdt,
    hr,
    hrv,
    recoverySignal,
    nsriData,
    onSnapshotSaved
  });

  useEffect(() => {
    latestDataRef.current = {
      score,
      state,
      sai,
      pri,
      rdt,
      hr,
      hrv,
      recoverySignal,
      nsriData,
      onSnapshotSaved
    };
  }, [score, state, sai, pri, rdt, hr, hrv, recoverySignal, nsriData, onSnapshotSaved]);

  // Stop any active speech synthesis
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    isProcessingRef.current = false;
    setVoiceState('idle');
  }, []);

  // Speak text using browser text-to-speech
  const speakText = useCallback((text) => {
    if (!synthRef.current) {
      setVoiceState('idle');
      isProcessingRef.current = false;
      return;
    }

    // Ensure recognition is stopped while speaking
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => 
      v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Daniel'))
    ) || voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      console.log('[NIRA Voice] SPEAKING: TTS output started');
      setVoiceState('speaking');
    };

    utterance.onend = () => {
      console.log('[NIRA Voice] TTS output ended. Returning to idle');
      setVoiceState('idle');
      isProcessingRef.current = false;
    };

    utterance.onerror = (err) => {
      console.warn('[NIRA Voice] TTS error:', err);
      setVoiceState('idle');
      isProcessingRef.current = false;
    };

    synthRef.current.speak(utterance);
  }, []);

  // Process intent and generate spoken response
  const processVoiceIntent = useCallback(async (queryText) => {
    if (!queryText || !queryText.trim()) {
      console.log('[NIRA Voice] Empty transcript received in processVoiceIntent, returning to idle');
      setVoiceState('idle');
      isListeningRef.current = false;
      isProcessingRef.current = false;
      return;
    }

    isProcessingRef.current = true;
    isListeningRef.current = false;
    setVoiceState('processing');

    const cleanQuery = queryText.trim();
    console.log(`[NIRA Voice] PROCESSING: transcript passed="${cleanQuery}"`);

    // Ensure recognition is stopped while processing
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    const q = cleanQuery.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, '').trim();
    const current = latestDataRef.current;
    console.log(`[NIRA Voice] INTENT ROUTING: normalized="${q}"`);

    try {
      // ----------------------------------------------------
      // INTENT 0: GREETING / READY ("Hey NIRA")
      // ----------------------------------------------------
      if (q === 'hey nira' || q === 'nira' || q === 'hello nira' || q === 'hi nira' || q === 'hey nira hello') {
        console.log('[NIRA Voice] INTENT DETECTED: Greeting');
        const reply = `Hello! I'm NIRA, your nervous-system intelligence. Your current NSRI score is ${current.score}, in the ${current.state} state. How can I assist your recovery right now?`;
        console.log('[NIRA Voice] RESPONSE:', reply);
        setResponseMessage(reply);
        speakText(reply);
        return;
      }

      // ----------------------------------------------------
      // INTENT 1: SAVE SNAPSHOT
      // ----------------------------------------------------
      if (
        q.includes('save this as a snapshot') ||
        q.includes('save snapshot') ||
        q.includes('save this moment') ||
        q.includes('capture snapshot') ||
        q.includes('save a snapshot') ||
        q.includes('take a snapshot') ||
        q.includes('capture a snapshot')
      ) {
        console.log('[NIRA Voice] INTENT DETECTED: Save Snapshot');
        const niraElem = document.querySelector('.nira-interp-body');
        const savedNira = niraElem ? niraElem.textContent.trim() : `Current autonomic state is ${current.state} with responsive recovery reserves.`;

        const guidanceElem = document.querySelector('.what-to-do-text');
        const savedGuidance = guidanceElem ? guidanceElem.textContent.trim() : 'Maintain scheduled recovery periods and regular hydration.';

        const payload = {
          title: `${current.state} Snapshot`,
          scenario: current.state,
          nsri_score: current.score,
          nsri_state: current.state,
          sai: current.sai,
          pri: current.pri,
          rdt: current.rdt,
          heart_rate: current.hr,
          hrv: current.hrv,
          stress_probability: current.nsriData?.stress_probability ?? (current.sai / 100),
          skin_temperature: current.nsriData?.skin_temperature ?? 34.8,
          eda_peaks: current.nsriData?.eda_peaks ?? 3,
          recovery_signal: current.recoverySignal,
          telemetry_source: 'Simulated Physiological Stream',
          data_quality: 'Optimal (98%)',
          nira_insight: savedNira,
          recovery_guidance: savedGuidance
        };

        const res = await createSnapshot(payload);
        const reply = "Done. I've saved your current NSRI state as a snapshot.";
        console.log('[NIRA Voice] RESPONSE:', reply);
        setResponseMessage(reply);
        speakText(reply);

        if (current.onSnapshotSaved) current.onSnapshotSaved(res.snapshot);
        window.dispatchEvent(new CustomEvent('nsri-snapshot-saved', { detail: res.snapshot }));
        return;
      }

      // ----------------------------------------------------
      // INTENT 2: GENERATE REPORT / EXPORT PDF
      // ----------------------------------------------------
      if (
        q.includes('generate my report') ||
        q.includes('generate report') ||
        q.includes('export report') ||
        q.includes('generate pdf') ||
        q.includes('download report') ||
        q.includes('export pdf') ||
        q.includes('create report')
      ) {
        console.log('[NIRA Voice] INTENT DETECTED: Generate Report');
        const reply = "Your NSRI report is ready.";
        console.log('[NIRA Voice] RESPONSE:', reply);
        setResponseMessage(reply);
        speakText(reply);
        setTimeout(() => {
          window.print();
        }, 800);
        return;
      }

      // ----------------------------------------------------
      // INTENT 3: COMPARE SNAPSHOTS
      // ----------------------------------------------------
      if (
        q.includes('compare my current state with my last snapshot') ||
        q.includes('compare snapshots') ||
        q.includes('compare with last snapshot') ||
        q.includes('compare with my last snapshot') ||
        q.includes('compare with previous snapshot') ||
        q.includes('compare snapshot')
      ) {
        console.log('[NIRA Voice] INTENT DETECTED: Compare Snapshots');
        const snapRes = await getSnapshots().catch(() => null);
        const snaps = snapRes?.snapshots || [];

        if (snaps.length >= 1) {
          const lastSnap = snaps[0];
          const lastScore = Math.round(lastSnap.nsri_score ?? current.score);
          const deltaScore = current.score - lastScore;
          const deltaSai = current.sai - Math.round(lastSnap.sai ?? current.sai);
          const deltaPri = current.pri - Math.round(lastSnap.pri ?? current.pri);

          let reply = '';
          if (deltaScore < 0) {
            reply = `Your NSRI is currently ${Math.abs(deltaScore)} points lower than your last snapshot. Physiological load has ${deltaSai <= 0 ? 'decreased' : 'moderated'} and recovery capacity has ${deltaPri >= 0 ? 'improved' : 'stabilized'}.`;
          } else if (deltaScore > 0) {
            reply = `Your NSRI is currently ${deltaScore} points higher than your last snapshot (${lastSnap.nsri_state || 'earlier state'}). Acute physiological load has increased, placing greater demand on recovery capacity.`;
          } else {
            reply = `Your NSRI composite score is unchanged at ${current.score} points compared with your last snapshot, reflecting steady autonomic balance.`;
          }

          console.log('[NIRA Voice] RESPONSE:', reply);
          setResponseMessage(reply);
          speakText(reply);
          return;
        } else {
          const reply = "You don't have any saved snapshots yet. Say 'Hey NIRA, save this as a snapshot' to capture your first baseline moment.";
          console.log('[NIRA Voice] RESPONSE:', reply);
          setResponseMessage(reply);
          speakText(reply);
          return;
        }
      }

      // ----------------------------------------------------
      // INTENT 4: MULTI-CLAUSE CONTRIBUTORS + WHAT TO DO
      // e.g. "Can you explain what is contributing to my score and what I should do right now?"
      // ----------------------------------------------------
      if (
        (q.includes('contributing') || q.includes('affecting') || q.includes('why is my score') || q.includes('why did my score') || q.includes('why did my nsri score')) &&
        (q.includes('what should i do') || q.includes('what to do') || q.includes('right now') || q.includes('how should i recover'))
      ) {
        console.log('[NIRA Voice] INTENT DETECTED: Explain Contributors + Action Guidance');
        const dominant = current.sai >= 50 ? 'acute physiological load (SAI)' : current.pri <= 40 ? 'reduced recovery reserves (PRI)' : 'accumulated recovery debt (RDT)';
        const guidanceElem = document.querySelector('.what-to-do-text');
        const advice = guidanceElem ? guidanceElem.textContent.trim() : 'Take a short low-stimulation break, hydrate, and practice slow diaphragmatic breathing.';
        const reply = `Your score of ${current.score} is primarily influenced by ${dominant}, with physiological load at ${current.sai} percent and recovery capacity at ${current.pri} percent. To support your recovery right now, ${advice.toLowerCase().startsWith('take') ? advice : 'take a low-stimulation break and rest.'}`;
        console.log('[NIRA Voice] RESPONSE:', reply);
        setResponseMessage(reply);
        speakText(reply);
        return;
      }

      // ----------------------------------------------------
      // INTENT 5: EXPLAIN SCORE / CONTRIBUTORS / SCORE CHANGE
      // e.g. "Why did my NSRI score change?", "Why did my NSRI score increase today?", "Can you explain what is contributing to my current score?"
      // ----------------------------------------------------
      if (
        q.includes('why did my nsri score') ||
        q.includes('why did my score') ||
        q.includes('why is my score') ||
        q.includes('what is affecting my score') ||
        q.includes('what is contributing to') ||
        q.includes('contributing to my') ||
        q.includes('score change') ||
        q.includes('score increase') ||
        q.includes('score decrease') ||
        q.includes('why am i in this state') ||
        q.includes('contributors') ||
        q.includes('what is driving my score') ||
        q.includes('what is contributing')
      ) {
        console.log('[NIRA Voice] INTENT DETECTED: Explain Score & Factors');
        const dominant = current.sai >= 50 ? 'acute physiological load (SAI)' : current.pri <= 40 ? 'reduced recovery reserves (PRI)' : 'accumulated recovery debt (RDT)';
        const reply = `Your score of ${current.score} is primarily influenced by ${dominant}. Physiological load is at ${current.sai} percent, while recovery capacity is at ${current.pri} percent. Ambient environmental conditions provide contextual background, but internal physiological signals remain the primary driver.`;
        console.log('[NIRA Voice] RESPONSE:', reply);
        setResponseMessage(reply);
        speakText(reply);
        return;
      }

      // ----------------------------------------------------
      // INTENT 6: GET RECOVERY REPORT / HOW IS MY RECOVERY
      // e.g. "How is my recovery today?", "Give me my recovery report", "Hey NIRA, how is my recovery today?"
      // ----------------------------------------------------
      if (
        q.includes('how is my recovery') ||
        q.includes('recovery report') ||
        q.includes('give me a report') ||
        q.includes('report of my current recovery state') ||
        q.includes('give me my recovery report') ||
        q.includes('recovery status') ||
        q.includes('how is my recovery today') ||
        q.includes('recovery state')
      ) {
        console.log('[NIRA Voice] INTENT DETECTED: Recovery Report');
        const reply = `Your current NSRI is ${current.score}, in the ${current.state} range. Physiological load is ${current.sai} percent, recovery capacity is ${current.pri} percent, and recovery debt is contributing ${current.rdt} percent to your score. Your recent recovery trend is ${current.recoverySignal.toLowerCase()}. NIRA recommends a short low-stimulation recovery period.`;
        console.log('[NIRA Voice] RESPONSE:', reply);
        setResponseMessage(reply);
        speakText(reply);
        return;
      }

      // ----------------------------------------------------
      // INTENT 7: AM I RECOVERING?
      // ----------------------------------------------------
      if (q.includes('am i recovering') || q.includes('is my recovery improving') || q.includes('check recovery')) {
        console.log('[NIRA Voice] INTENT DETECTED: Am I Recovering');
        const reply = current.recoverySignal === 'Optimal' || current.recoverySignal === 'Improving'
          ? `Yes, your recovery signals are positive. Parasympathetic recovery capacity is at ${current.pri} percent, which is effectively offsetting physiological demand.`
          : `Recovery reserves are currently lagging behind accumulated load. Your recovery signal is ${current.recoverySignal.toLowerCase()}, indicating scheduled restorative pacing is advised.`;
        console.log('[NIRA Voice] RESPONSE:', reply);
        setResponseMessage(reply);
        speakText(reply);
        return;
      }

      // ----------------------------------------------------
      // INTENT 8: WHAT SHOULD I DO NOW?
      // ----------------------------------------------------
      if (q.includes('what should i do') || q.includes('what can i do') || q.includes('what do you recommend') || q.includes('action plan') || q.includes('what should i do right now')) {
        console.log('[NIRA Voice] INTENT DETECTED: Action Guidance');
        const guidanceElem = document.querySelector('.what-to-do-text');
        const advice = guidanceElem ? guidanceElem.textContent.trim() : 'Take a low-stimulation break, hydrate, and practice slow rhythmic breathing.';
        const reply = `Based on your current ${current.state} state, ${advice}`;
        console.log('[NIRA Voice] RESPONSE:', reply);
        setResponseMessage(reply);
        speakText(reply);
        return;
      }

      // ----------------------------------------------------
      // INTENT 9: GET CURRENT STATE / NSRI
      // ----------------------------------------------------
      if (
        q.includes('current nsri') ||
        q.includes('whats my score') ||
        q.includes('what is my score') ||
        q.includes('how am i doing') ||
        q.includes('what is my state') ||
        q.includes('current state') ||
        q.includes('whats my nsri') ||
        q.includes('what is my nsri')
      ) {
        console.log('[NIRA Voice] INTENT DETECTED: Current NSRI Score');
        const reply = `Your current NSRI score is ${current.score} out of 100, which places you in the ${current.state} state. Your physiological load is ${current.sai >= 50 ? 'elevated' : 'moderate'} relative to your current recovery capacity.`;
        console.log('[NIRA Voice] RESPONSE:', reply);
        setResponseMessage(reply);
        speakText(reply);
        return;
      }

      // ----------------------------------------------------
      // INTENT 10: GENERAL NIRA QUESTION -> OLLAMA BACKEND
      // ----------------------------------------------------
      console.log('[NIRA Voice] INTENT DETECTED: General Query (Routing to Ollama)');
      const aiReply = await sendChatMessage(cleanQuery, current.nsriData, true);
      const cleanReply = aiReply.replace(/[*_#`]/g, '').trim();
      console.log('[NIRA Voice] RESPONSE:', cleanReply);
      setResponseMessage(cleanReply);
      speakText(cleanReply);
    } catch (err) {
      console.error('[NIRA Voice] Voice intent processing error:', err);
      const fallbackReply = `Your current NSRI score is ${current.score} in the ${current.state} state. Physiological load is ${current.sai} percent and recovery capacity is ${current.pri} percent.`;
      setResponseMessage(fallbackReply);
      speakText(fallbackReply);
    }
  }, [speakText]);

  // Keep ref updated to always have latest processVoiceIntent
  useEffect(() => {
    processVoiceIntentRef.current = processVoiceIntent;
  }, [processVoiceIntent]);

  // Finalize transcript accumulation and trigger NIRA processing
  const handleFinalizeAndProcess = useCallback((overrideText = null) => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    const rawText = overrideText !== null && overrideText !== undefined
      ? overrideText
      : (currentFullTranscriptRef.current || finalTranscriptRef.current);

    const textToProcess = (rawText || '').trim();
    console.log(`[NIRA Voice] FINALIZING: textToProcess="${textToProcess}"`);

    isListeningRef.current = false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    if (textToProcess && textToProcess.length >= 2) {
      setTranscript(textToProcess);
      if (processVoiceIntentRef.current) {
        processVoiceIntentRef.current(textToProcess);
      }
    } else {
      console.log('[NIRA Voice] Insufficient speech text captured, setting state to idle');
      setVoiceState('idle');
    }
  }, []);

  // Keep ref updated to always have latest handleFinalizeAndProcess
  useEffect(() => {
    handleFinalizeAndProcessRef.current = handleFinalizeAndProcess;
  }, [handleFinalizeAndProcess]);

  // Initialize browser Speech Recognition (Runs ONCE on mount)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[NIRA Voice] Web Speech API not supported in this browser environment');
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = navigator.language || 'en-US';

      recognition.onstart = () => {
        console.log('[NIRA Voice] LISTENING: SpeechRecognition onstart fired');
        setVoiceState('listening');
        setPermissionError(null);
      };

      recognition.onresult = (event) => {
        console.log(`[NIRA Voice] RAW RESULT: resultIndex=${event.resultIndex}, totalResults=${event.results.length}`);

        let interimText = '';
        let finalAccumulated = '';

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          const piece = (result[0]?.transcript || '').trim();
          if (!piece) continue;

          if (result.isFinal) {
            finalAccumulated += (finalAccumulated ? ' ' : '') + piece;
          } else {
            interimText += (interimText ? ' ' : '') + piece;
          }
        }

        finalTranscriptRef.current = finalAccumulated;
        const fullCurrent = (finalAccumulated + (interimText ? (finalAccumulated ? ' ' : '') + interimText : '')).trim();
        currentFullTranscriptRef.current = fullCurrent;

        console.log(`[NIRA Voice] FINAL: "${finalAccumulated}"`);
        console.log(`[NIRA Voice] INTERIM: "${interimText}"`);
        console.log(`[NIRA Voice] HEARD (current full): "${fullCurrent}"`);

        if (fullCurrent) {
          setTranscript(fullCurrent);
        }

        // Reset silence pause detection timer (2.4s after speech detected)
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        if (fullCurrent.length >= 2 && isListeningRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            if (isListeningRef.current) {
              console.log('[NIRA Voice] Silence timeout (2.4s) reached. Auto-finalizing transcript...');
              if (handleFinalizeAndProcessRef.current) {
                handleFinalizeAndProcessRef.current(currentFullTranscriptRef.current);
              }
            }
          }, 2400);
        }
      };

      recognition.onerror = (event) => {
        console.warn('[NIRA Voice] SpeechRecognition onerror:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setPermissionError('Microphone access is unavailable. You can click any sample voice query below to talk to NIRA.');
          isListeningRef.current = false;
          setVoiceState('idle');
        } else if (event.error === 'no-speech') {
          console.log('[NIRA Voice] No speech detected during active window');
        }
      };

      recognition.onend = () => {
        console.log('[NIRA Voice] SpeechRecognition onend fired, isListening =', isListeningRef.current, 'isProcessing =', isProcessingRef.current);
        // If user is still actively listening and did NOT transition to processing/speaking
        if (isListeningRef.current && !isProcessingRef.current) {
          if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = setTimeout(() => {
            if (isListeningRef.current && !isProcessingRef.current) {
              try {
                console.log('[NIRA Voice] Auto-restarting recognition session to maintain listening state...');
                recognitionRef.current?.start();
              } catch (err) {
                console.warn('[NIRA Voice] Recognition restart error:', err);
              }
            }
          }, 150);
        }
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.error('[NIRA Voice] Error initializing speech recognition:', e);
      setIsSupported(false);
    }

    return () => {
      isListeningRef.current = false;
      isProcessingRef.current = false;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []); // Run ONCE on mount

  // Toggle microphone listening (Explicit User Action)
  const handleToggleListening = () => {
    stopSpeaking();

    if (isListeningRef.current || voiceState === 'listening') {
      // User pressed Stop
      console.log('[NIRA Voice] User explicitly pressed Stop button. Finalizing captured speech...');
      handleFinalizeAndProcess(currentFullTranscriptRef.current);
      return;
    }

    if (!isSupported || !recognitionRef.current) {
      setPermissionError('Speech recognition is not supported in this browser. You can tap any of the prompts below to talk to NIRA.');
      return;
    }

    // Initialize fresh session
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
    finalTranscriptRef.current = '';
    currentFullTranscriptRef.current = '';
    setTranscript('');
    setResponseMessage('');
    isListeningRef.current = true;
    isProcessingRef.current = false;

    try {
      console.log('[NIRA Voice] Starting recognition session...');
      recognitionRef.current.start();
      setVoiceState('listening');
    } catch (e) {
      console.warn('[NIRA Voice] Error starting recognition:', e);
      try {
        recognitionRef.current.stop();
        setTimeout(() => {
          if (isListeningRef.current) {
            recognitionRef.current?.start();
            setVoiceState('listening');
          }
        }, 200);
      } catch (err) {}
    }
  };

  // Trigger preset question as voice
  const handleTriggerPreset = (promptText) => {
    stopSpeaking();
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    finalTranscriptRef.current = promptText;
    currentFullTranscriptRef.current = promptText;
    setTranscript(promptText);
    processVoiceIntent(promptText);
  };

  return (
    <div className="nira-voice-container" id="nira-voice">
      {/* Header Row */}
      <div className="voice-header-row">
        <div className="voice-title-group">
          <div className="voice-badge-row">
            <span className="voice-badge">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
              NIRA Voice
            </span>
          </div>
          <p className="voice-subtitle">Talk to your nervous-system intelligence</p>
        </div>

        <div className={`voice-state-pill ${voiceState}`}>
          {voiceState === 'listening' ? (
            <>
              <span className="nira-status-dot pulse-red" style={{ background: 'var(--primary)' }} />
              <span>Listening for speech...</span>
            </>
          ) : voiceState === 'processing' ? (
            <>
              <span className="nira-status-dot pulse-amber" style={{ background: 'var(--earth)' }} />
              <span>Analyzing nervous-system state...</span>
            </>
          ) : voiceState === 'speaking' ? (
            <>
              <span className="nira-status-dot pulse-green" style={{ background: 'var(--sage)' }} />
              <span>NIRA Speaking</span>
            </>
          ) : (
            <>
              <span className="nira-status-dot" style={{ background: 'var(--text-muted)' }} />
              <span>Microphone off</span>
            </>
          )}
        </div>
      </div>

      {/* Central Audio Interaction Stage */}
      <div className="voice-stage-area">
        {/* Siri-inspired Glowing Pulse Rings */}
        <div className={`voice-orb-wrapper ${voiceState}`}>
          <div className="voice-pulse-ring-outer" />
          <div className="voice-pulse-ring-inner" />
          <button 
            className="voice-orb-btn"
            onClick={handleToggleListening}
            aria-label={voiceState === 'listening' ? 'Stop listening' : 'Tap to speak to NIRA'}
            title={voiceState === 'listening' ? 'Tap to stop' : 'Tap to speak'}
          >
            {voiceState === 'listening' ? (
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="var(--primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="6" width="12" height="12" rx="2" fill="var(--primary)" />
              </svg>
            ) : voiceState === 'speaking' ? (
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="var(--sage)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>
        </div>

        {/* State Label & Instruction */}
        <h4 className="voice-instruction-main">
          {voiceState === 'listening' 
            ? 'Listening... Speak naturally' 
            : voiceState === 'processing'
              ? 'Interpreting physiological signals...'
              : voiceState === 'speaking'
                ? 'NIRA is responding aloud'
                : 'Tap to speak with NIRA'}
        </h4>
        <p className="voice-instruction-sub">
          {voiceState === 'listening'
            ? 'Say "Hey NIRA, give me my recovery report" or "Save this as a snapshot" — tap button when finished'
            : 'Ask about your NSRI state, request recovery pacing, or manage snapshots.'}
        </p>

        {/* Live User Transcript */}
        {transcript && (
          <div className="voice-live-transcript-box">
            <svg className="transcript-quote-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            <span>"{transcript}"</span>
          </div>
        )}

        {/* Spoken Response Presentation Card */}
        {responseMessage && (
          <div className="voice-response-card">
            <div className="voice-response-header">
              <div className="voice-response-author">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                NIRA VOICE RESPONSE
              </div>
              {voiceState === 'speaking' && (
                <button className="voice-stop-btn" onClick={stopSpeaking}>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                  Stop Audio
                </button>
              )}
            </div>
            <p className="voice-response-text">{responseMessage}</p>
          </div>
        )}
      </div>

      {/* Permission Fallback Banner */}
      {permissionError && (
        <div className="voice-permission-banner">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{permissionError}</span>
        </div>
      )}

      {/* Suggested Natural Voice Commands */}
      <div className="voice-suggestions-section">
        <span className="suggestions-label">Try Speaking or Click:</span>
        <div className="voice-chips-grid">
          {SUGGESTED_VOICE_QUERIES.map((queryText) => (
            <button
              key={queryText}
              className="voice-suggestion-chip"
              onClick={() => handleTriggerPreset(queryText)}
              disabled={voiceState === 'listening' || voiceState === 'processing'}
            >
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
              <span>{queryText}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NIRAVoice;
