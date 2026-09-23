import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Clock, AlertCircle } from 'lucide-react';

export default function SpeechRecorder({ onTranscriptComplete, isEvaluating = false }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [speechSupported, setSpeechSupported] = useState(true);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let current = '';
      for (let i = 0; i < event.results.length; i++) {
        current += event.results[i][0].transcript + ' ';
      }
      setTranscript(current);
      transcriptRef.current = current;
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        stopRecording();
      }
    };

    recognition.onend = () => {
      // Auto-restart if still flagged as recording
      if (isRecording) {
        try {
          recognition.start();
        } catch (e) {
          // ignore
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = () => {
    setTranscript('');
    transcriptRef.current = '';
    setElapsedSeconds(0);
    setIsRecording(true);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Recognition start exception:', e);
      }
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    // Calculate Speech Metrics
    const text = transcriptRef.current.trim();
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const minutes = Math.max(0.1, elapsedSeconds / 60);
    const wpm = Math.round(wordCount / minutes);

    // Count filler words: um, uh, like, you know, sort of
    const fillerRegex = /\b(um|uh|erm|like|you know|sort of|actually)\b/gi;
    const fillerMatches = text.match(fillerRegex) || [];
    const fillerCount = fillerMatches.length;

    const metrics = {
      wpm: wpm > 0 ? wpm : 125,
      filler_count: fillerCount,
      duration_sec: Math.max(5, elapsedSeconds),
      word_count: wordCount,
    };

    if (onTranscriptComplete) {
      onTranscriptComplete(text, metrics);
    }
  };

  return (
    <div style={{ background: '#FAF6F0', borderRadius: 'var(--radius-md)', padding: '20px', border: '1px solid var(--card-cream-border)', marginTop: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-wine-primary)', fontWeight: '600' }}>
          <Volume2 size={18} color="var(--btn-cherry-bg)" />
          <span>Speech Answer & Delivery Tracking</span>
        </div>

        {isRecording && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8c1d1d', fontWeight: '600', fontSize: '13px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8c1d1d', animation: 'pulse 1s infinite' }} />
            <Clock size={14} />
            <span>{elapsedSeconds}s</span>
          </div>
        )}
      </div>

      {!speechSupported && (
        <div style={{ background: 'var(--status-partial-bg)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12.5px', color: 'var(--status-partial-text)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={15} />
          <span>Speech Recognition is best supported on Chrome, Edge, or Safari. You can also type your answer below.</span>
        </div>
      )}

      {/* Live Transcript Area */}
      <div
        style={{
          minHeight: '80px',
          maxHeight: '160px',
          overflowY: 'auto',
          background: '#ffffff',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--card-cream-border)',
          padding: '12px',
          fontSize: '14px',
          color: transcript ? 'var(--text-wine-primary)' : 'var(--text-wine-muted)',
          lineHeight: '1.6',
          marginBottom: '16px',
        }}
      >
        {transcript ? (
          <span>{transcript}</span>
        ) : isRecording ? (
          <span style={{ fontStyle: 'italic' }}>Listening... speak clearly into your microphone...</span>
        ) : (
          <span style={{ fontStyle: 'italic' }}>
            Click "Start Speaking 🎙" to record your verbal response. The AI will analyze observable characteristics including clarity, pacing (WPM), and filler words.
          </span>
        )}
      </div>

      {/* Control buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {!isRecording ? (
          <button
            type="button"
            className="btn-primary"
            onClick={startRecording}
            disabled={isEvaluating}
            style={{ padding: '9px 18px', fontSize: '13.5px' }}
          >
            <Mic size={16} />
            <span>Start Speaking 🎙</span>
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            onClick={stopRecording}
            style={{ background: '#8c1d1d', padding: '9px 18px', fontSize: '13.5px' }}
          >
            <MicOff size={16} />
            <span>Done Speaking (Submit Answer)</span>
          </button>
        )}

        {isRecording && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setIsRecording(false);
              if (timerRef.current) clearInterval(timerRef.current);
              if (recognitionRef.current) recognitionRef.current.stop();
              setTranscript('');
            }}
            style={{ padding: '8px 14px', fontSize: '12.5px', color: 'var(--text-wine-muted)' }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
