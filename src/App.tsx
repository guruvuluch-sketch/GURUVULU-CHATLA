/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Square, 
  Image as ImageIcon, 
  Send, 
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  ExternalLink,
  Trash2,
  Upload,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeIntent, IntentResult } from './services/gemini.ts';

export default function App() {
  const [inputText, setInputText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [audio, setAudio] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<IntentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setAudio(reader.result as string);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!inputText && !image && !audio) {
      setError("Please provide some input (text, image, or voice).");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const analysis = await analyzeIntent({
        text: inputText,
        image: image || undefined,
        audio: audio || undefined
      });
      setResult(analysis);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearInputs = () => {
    setInputText('');
    setImage(null);
    setAudio(null);
    setResult(null);
    setError(null);
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'High': return 'text-red-500 bg-red-50 border-red-200';
      case 'Medium': return 'text-amber-500 bg-amber-50 border-amber-200';
      default: return 'text-emerald-500 bg-emerald-50 border-emerald-200';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'High': return <AlertTriangle className="w-5 h-5" />;
      case 'Medium': return <Info className="w-5 h-5" />;
      default: return <CheckCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">IntentBridge</h1>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-500">
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">How it works</span>
            <span className="hover:text-indigo-600 cursor-pointer transition-colors">Privacy</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          
          {/* Input Section */}
          <section className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">Bridge the gap between thought and action.</h2>
              <p className="text-gray-500 text-lg">Input text, record voice, or upload images to decode intent with precision.</p>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-6">
              {/* Text Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Text Input</label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="What's on your mind?"
                  className="w-full h-32 p-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Media Controls */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-medium transition-all ${
                    isRecording 
                    ? 'bg-red-50 text-red-600 ring-1 ring-red-200 animate-pulse' 
                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  }`}
                >
                  {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
                  {isRecording ? 'Stop Recording' : 'Voice Input'}
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 font-medium transition-all"
                >
                  <ImageIcon className="w-4 h-4" />
                  Upload Image
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Preview Area */}
              <AnimatePresence>
                {(image || audio) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200"
                  >
                    {image && (
                      <div className="relative group">
                        <img src={image} alt="Preview" className="w-20 h-20 object-cover rounded-xl border border-gray-200" />
                        <button 
                          onClick={() => setImage(null)}
                          className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-sm border border-gray-100 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    {audio && (
                      <div className="relative group flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-200">
                        <Mic className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-medium text-gray-500">Voice Note</span>
                        <button 
                          onClick={() => setAudio(null)}
                          className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-sm border border-gray-100 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || (!inputText && !image && !audio)}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white py-3.5 rounded-2xl font-semibold transition-all shadow-lg shadow-indigo-200"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  {isLoading ? 'Analyzing...' : 'Analyze Intent'}
                </button>
                <button
                  onClick={clearInputs}
                  className="p-3.5 bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-all"
                  title="Clear all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </div>
          </section>

          {/* Result Section */}
          <section className="relative">
            <AnimatePresence mode="wait">
              {!result && !isLoading && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4 bg-white/50 rounded-3xl border-2 border-dashed border-gray-100"
                >
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                    <Zap className="text-gray-300 w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-gray-900">Awaiting Input</h3>
                    <p className="text-sm text-gray-500 max-w-[240px]">Your analysis results will appear here once you submit your input.</p>
                  </div>
                </motion.div>
              )}

              {isLoading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center p-12 space-y-6"
                >
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 w-8 h-8" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold text-gray-900">Decoding Intent</h3>
                    <p className="text-sm text-gray-500 animate-pulse">Consulting Gemini AI models...</p>
                  </div>
                </motion.div>
              )}

              {result && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* Detected Intent */}
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Detected Intent</label>
                      <h3 className="text-2xl font-bold text-gray-900 leading-tight">{result.intent}</h3>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Risk Level */}
                      <div className={`p-4 rounded-2xl border ${getRiskColor(result.riskLevel)} flex items-center gap-3`}>
                        {getRiskIcon(result.riskLevel)}
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Risk Level</p>
                          <p className="font-bold">{result.riskLevel}</p>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/30 flex items-center gap-3 text-indigo-600">
                        <CheckCircle className="w-5 h-5" />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Analysis</p>
                          <p className="font-bold">Complete</p>
                        </div>
                      </div>
                    </div>

                    {/* Recommended Action */}
                    <div className="space-y-3">
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Recommended Action</label>
                      <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                        <p className="text-gray-700 leading-relaxed">{result.recommendedAction}</p>
                      </div>
                    </div>

                    {/* Helpful Resources */}
                    <div className="space-y-4">
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Helpful Resources</label>
                      <div className="grid gap-3">
                        {result.helpfulResources.map((resource, idx) => (
                          <a
                            key={idx}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-indigo-200 hover:shadow-md transition-all"
                          >
                            <span className="font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">{resource.title}</span>
                            <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-gray-100">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-gray-400">
          <p>© 2026 IntentBridge. Powered by Gemini AI.</p>
          <div className="flex items-center gap-8">
            <span className="hover:text-gray-600 cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-gray-600 cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-gray-600 cursor-pointer transition-colors">Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
