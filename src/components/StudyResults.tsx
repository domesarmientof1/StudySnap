import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  HelpCircle,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Layers,
  Camera,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  ThumbsUp,
  RefreshCw,
  Share2,
  Folder
} from 'lucide-react';
import { AnalysisResult, Language, Project } from '../types';
import { getT } from '../i18n';
import { getProjectTheme, getProjectIconComponent } from './ProjectManagerModal';

interface StudyResultsProps {
  result: AnalysisResult;
  photoUrl: string;
  language: Language;
  projectId?: string | null;
  projects?: Project[];
  onMoveProject?: (newProjectId: string | null) => void;
  onRetake: () => void;
  onSelectSample?: () => void;
}

export const StudyResults: React.FC<StudyResultsProps> = ({
  result,
  photoUrl,
  language,
  projectId,
  projects = [],
  onMoveProject,
  onRetake,
  onSelectSample,
}) => {
  const t = getT(language);
  const [showMoveDropdown, setShowMoveDropdown] = useState(false);

  // Tabs: 'summary' | 'questions'
  const [activeTab, setActiveTab] = useState<'summary' | 'questions'>('summary');
  // Question View Mode: 'flashcard' | 'list'
  const [questionMode, setQuestionMode] = useState<'flashcard' | 'list'>('flashcard');

  // Flashcard carousel state
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
  const [revealedHints, setRevealedHints] = useState<Record<number, boolean>>({});
  const [knowledgeRatings, setKnowledgeRatings] = useState<Record<number, 'known' | 'review'>>({});

  // Audio speech synthesis state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState<boolean>(false);

  const questions = result.questions || [];
  const currentQuestion = questions[currentQIndex];

  // Stop speech when component unmounts
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Text-to-Speech handler
  const handleReadAloud = (textToRead: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = language === 'es' ? 'es-ES' : 'en-US';
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Toggle answer reveal for a specific question id
  const toggleAnswer = (qId: number) => {
    setRevealedAnswers((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  // Toggle hint reveal
  const toggleHint = (qId: number) => {
    setRevealedHints((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  // Mark knowledge
  const markKnowledge = (qId: number, status: 'known' | 'review') => {
    setKnowledgeRatings((prev) => ({
      ...prev,
      [qId]: status,
    }));
  };

  // Reset quiz progress
  const resetQuestions = () => {
    setRevealedAnswers({});
    setRevealedHints({});
    setKnowledgeRatings({});
    setCurrentQIndex(0);
  };

  // Copy helper
  const copyToClipboard = (content: string, type: string) => {
    navigator.clipboard.writeText(content);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  // Format full study guide for copying
  const getFullGuideText = () => {
    const qText = questions
      .map(
        (q, idx) =>
          `Q${idx + 1}: ${q.question}\nAnswer: ${q.answer}\nHint: ${q.hint}`
      )
      .join('\n\n');

    return `${result.title.toUpperCase()}\nSubject: ${result.subject || 'Notes'}\n\n=== SUMMARY ===\n${result.summary}\n\n=== 5 STUDY QUESTIONS ===\n${qText}`;
  };

  // ==========================================
  // UNREADABLE / ILLEGIBLE NOTES STATE
  // ==========================================
  if (!result.isStudyNotes) {
    return (
      <div className="max-w-xl mx-auto p-4 sm:p-6 animate-fadeIn">
        <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-3xl p-6 sm:p-8 text-center shadow-lg">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            {t.unreadableTitle}
          </h2>

          <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl p-4 mb-5 border border-amber-200/60 dark:border-amber-800/60 text-left">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1">
              {t.confidenceNotes}
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {result.readabilityAssessment || t.unreadableAdvice}
            </p>
          </div>

          <div className="text-left text-xs space-y-2.5 text-slate-600 dark:text-slate-400 mb-6 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              💡 {language === 'es' ? 'Consejos para una foto nítida:' : 'Tips for a crystal-clear snap:'}
            </p>
            <p>• {language === 'es' ? 'Buena luz natural o linterna sin reflejos directos.' : 'Use bright even lighting to avoid heavy shadows.'}</p>
            <p>• {language === 'es' ? 'Mantén el teléfono paralelo a la hoja para evitar distorsión.' : 'Hold phone parallel to the paper so lines stay straight.'}</p>
            <p>• {language === 'es' ? 'Acércate para que las notas llenen la mayor parte de la pantalla.' : 'Fill the camera frame with your notes and tap to focus.'}</p>
          </div>

          {/* Thumbnail preview of the unreadable shot */}
          {photoUrl && (
            <div className="mb-6 flex justify-center">
              <div className="relative group rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 max-w-[200px] shadow-sm">
                <img src={photoUrl} alt="Captured note" className="w-full h-32 object-cover" />
                <span className="absolute bottom-1 right-1 px-2 py-0.5 rounded bg-black/60 text-[10px] text-white">
                  Original
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={onRetake}
              className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 active:scale-95 transition flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              {t.unreadableRetake}
            </button>

            {onSelectSample && (
              <button
                onClick={onSelectSample}
                className="py-3 px-6 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm active:scale-95 transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                {t.unreadableSample}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // READABLE NOTES SUCCESS STATE
  // ==========================================
  const totalQuestions = questions.length;
  const knownCount = Object.values(knowledgeRatings).filter((v) => v === 'known').length;
  const reviewCount = Object.values(knowledgeRatings).filter((v) => v === 'review').length;
  const isAllAnswered = Object.keys(revealedAnswers).length >= totalQuestions && totalQuestions > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 sm:py-6 space-y-5 animate-fadeIn">
      {/* Title & Metadata Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Project Badge & Move Selector */}
              {onMoveProject && (
                <div className="relative">
                  {(() => {
                    const currentProj = projects.find((p) => p.id === projectId);
                    const theme = currentProj ? getProjectTheme(currentProj.color) : null;
                    const IconComp = currentProj ? getProjectIconComponent(currentProj.icon) : Folder;

                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowMoveDropdown(!showMoveDropdown)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
                            theme
                              ? theme.light
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                          title={t.moveToProject}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                          <span>{currentProj ? currentProj.name : t.uncategorized}</span>
                          <span className="text-[10px] opacity-60">▾</span>
                        </button>

                        {showMoveDropdown && (
                          <div className="absolute left-0 mt-1.5 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-30 animate-fadeIn space-y-1">
                            <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {t.moveToProject}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                onMoveProject(null);
                                setShowMoveDropdown(false);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between ${
                                !projectId ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              <span>{t.uncategorized}</span>
                              {!projectId && <Check className="w-3.5 h-3.5" />}
                            </button>
                            {projects.map((proj) => {
                              const pTheme = getProjectTheme(proj.color);
                              const PIcon = getProjectIconComponent(proj.icon);
                              const isCurrent = proj.id === projectId;

                              return (
                                <button
                                  key={proj.id}
                                  type="button"
                                  onClick={() => {
                                    onMoveProject(proj.id);
                                    setShowMoveDropdown(false);
                                  }}
                                  className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between ${
                                    isCurrent ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className={`w-2 h-2 rounded-full ${pTheme.bg}`} />
                                    <span className="truncate">{proj.name}</span>
                                  </div>
                                  {isCurrent && <Check className="w-3.5 h-3.5" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {result.subject && (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {result.subject}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
              {result.title}
            </h1>
          </div>

          {/* Photo Thumbnail Button to view original */}
          {photoUrl && (
            <button
              onClick={() => setShowPhotoModal(true)}
              className="group relative flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-indigo-500/40 shadow-sm hover:scale-105 active:scale-95 transition"
              title={t.viewOriginal}
            >
              <img src={photoUrl} alt="Notes photo" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition flex items-center justify-center text-white">
                <Eye className="w-4 h-4 drop-shadow" />
              </div>
            </button>
          )}
        </div>

        {/* Key Topics Tags */}
        {result.keyTopics && result.keyTopics.length > 0 && (
          <div className="mt-3.5 flex flex-wrap gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            {result.keyTopics.map((topic, i) => (
              <span
                key={i}
                className="px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                #{topic}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main Tabs Navigation: Summary vs 5 Questions */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
        <button
          onClick={() => setActiveTab('summary')}
          className={`py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition ${
            activeTab === 'summary'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{t.summaryTab}</span>
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition ${
            activeTab === 'questions'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>{t.questionsTab}</span>
          <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs flex items-center justify-center">
            {questions.length}
          </span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: SUMMARY                                       */}
      {/* ==================================================== */}
      {activeTab === 'summary' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              {language === 'es' ? 'Resumen Inteligente' : 'High-Yield Summary'}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleReadAloud(result.summary)}
                type="button"
                className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition ${
                  isSpeaking
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
                title={isSpeaking ? t.stopListening : t.listen}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{isSpeaking ? t.stopListening : t.listen}</span>
              </button>

              <button
                onClick={() => copyToClipboard(result.summary, 'summary')}
                type="button"
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition text-xs font-medium flex items-center gap-1.5"
                title={t.copySummary}
              >
                {copiedType === 'summary' ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="hidden sm:inline text-emerald-600">{t.copied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="hidden sm:inline">{t.copySummary}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Formatted Summary Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line">
            {result.summary}
          </div>

          {/* Next action hint */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => setActiveTab('questions')}
              className="py-2.5 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-2 transition"
            >
              <span>{language === 'es' ? 'Practicar las 5 preguntas' : 'Practice the 5 questions'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: FIVE STUDY QUESTIONS                          */}
      {/* ==================================================== */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {/* Subheader: View Mode Switcher (Flashcard vs List) */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {t.studyMode}
            </span>

            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setQuestionMode('flashcard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  questionMode === 'flashcard'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                {t.flashcardMode}
              </button>

              <button
                onClick={() => setQuestionMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  questionMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                {t.listMode}
              </button>
            </div>
          </div>

          {/* Mode 1: Flashcard Carousel (1 by 1) */}
          {questionMode === 'flashcard' && currentQuestion && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5 transition-all">
              {/* Question Header & Navigation Dots */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  {t.questionCounter
                    .replace('{current}', String(currentQIndex + 1))
                    .replace('{total}', String(totalQuestions))}
                </span>

                {/* Progress Dots */}
                <div className="flex items-center gap-1.5">
                  {questions.map((q, idx) => {
                    const isKnown = knowledgeRatings[q.id] === 'known';
                    const isReview = knowledgeRatings[q.id] === 'review';
                    const isCurrent = idx === currentQIndex;

                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQIndex(idx)}
                        className={`w-3 h-3 rounded-full transition-all ${
                          isCurrent
                            ? 'ring-2 ring-indigo-500 scale-125'
                            : 'opacity-70 hover:opacity-100'
                        } ${
                          isKnown
                            ? 'bg-emerald-500'
                            : isReview
                            ? 'bg-amber-500'
                            : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                        title={`Question ${idx + 1}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Question Card Box */}
              <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                  {currentQuestion.question}
                </p>

                {/* Audio Listen for this question */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleReadAloud(
                        `${currentQuestion.question}. ${
                          revealedAnswers[currentQuestion.id] ? currentQuestion.answer : ''
                        }`
                      )
                    }
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{t.listen}</span>
                  </button>

                  {/* Hint Toggle */}
                  {currentQuestion.hint && (
                    <button
                      onClick={() => toggleHint(currentQuestion.id)}
                      className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium hover:underline transition ml-2"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>
                        {revealedHints[currentQuestion.id] ? t.hideHint : t.showHint}
                      </span>
                    </button>
                  )}
                </div>

                {/* Hint Reveal Box */}
                {revealedHints[currentQuestion.id] && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 rounded-xl text-xs text-amber-900 dark:text-amber-200 animate-fadeIn">
                    <span className="font-semibold">💡 Hint: </span>
                    {currentQuestion.hint}
                  </div>
                )}
              </div>

              {/* Revealable Answer Section */}
              <div className="space-y-3">
                {!revealedAnswers[currentQuestion.id] ? (
                  <button
                    onClick={() => toggleAnswer(currentQuestion.id)}
                    className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/25 active:scale-98 transition flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {t.revealAnswer}
                  </button>
                ) : (
                  <div className="space-y-3 animate-fadeIn">
                    <div className="p-4 sm:p-5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          {language === 'es' ? 'Respuesta Correcta' : 'Correct Answer'}
                        </span>
                        <button
                          onClick={() => toggleAnswer(currentQuestion.id)}
                          className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                          {t.hideAnswer}
                        </button>
                      </div>

                      <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
                        {currentQuestion.answer}
                      </p>
                    </div>

                    {/* Self-Rating Bar */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-500 font-medium">
                        {language === 'es' ? '¿Cómo te fue?' : 'How did you do?'}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => markKnowledge(currentQuestion.id, 'review')}
                          className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                            knowledgeRatings[currentQuestion.id] === 'review'
                              ? 'bg-amber-500 text-white shadow-sm'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                          }`}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          {t.needsReview}
                        </button>

                        <button
                          onClick={() => markKnowledge(currentQuestion.id, 'known')}
                          className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                            knowledgeRatings[currentQuestion.id] === 'known'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          {t.knewIt}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Card Navigation: Prev / Next */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentQIndex === 0}
                  className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t.prev}
                </button>

                <span className="text-xs text-slate-400 font-medium">
                  {currentQIndex + 1} / {totalQuestions}
                </span>

                <button
                  onClick={() => setCurrentQIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                  disabled={currentQIndex === totalQuestions - 1}
                  className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition flex items-center gap-1"
                >
                  {t.next}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Mode 2: All 5 Questions in List Form */}
          {questionMode === 'list' && (
            <div className="space-y-3">
              {questions.map((q, idx) => {
                const isAnswerRevealed = Boolean(revealedAnswers[q.id]);
                const isHintRevealed = Boolean(revealedHints[q.id]);

                return (
                  <div
                    key={q.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                          Question {idx + 1}
                        </span>
                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                          {q.question}
                        </h3>
                      </div>

                      <button
                        onClick={() => toggleAnswer(q.id)}
                        className={`p-2 rounded-xl border text-xs font-medium flex-shrink-0 transition ${
                          isAnswerRevealed
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                            : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                        }`}
                        title={isAnswerRevealed ? t.hideAnswer : t.revealAnswer}
                      >
                        {isAnswerRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Hint */}
                    {q.hint && (
                      <div>
                        <button
                          onClick={() => toggleHint(q.id)}
                          className="text-xs text-amber-600 dark:text-amber-400 font-medium hover:underline flex items-center gap-1"
                        >
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span>{isHintRevealed ? t.hideHint : t.showHint}</span>
                        </button>
                        {isHintRevealed && (
                          <div className="mt-2 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 rounded-xl text-xs text-amber-900 dark:text-amber-200">
                            {q.hint}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Revealed Answer Box */}
                    {isAnswerRevealed && (
                      <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70 rounded-xl space-y-1 text-sm text-slate-800 dark:text-slate-200 animate-fadeIn">
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase block">
                          {language === 'es' ? 'Respuesta:' : 'Answer:'}
                        </span>
                        <p>{q.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Mastery Progress Card */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {t.answeredProgress}:
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">
                  ✓ {knownCount} {t.knewIt}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-medium">
                  ⟳ {reviewCount} {t.needsReview}
                </span>
              </div>
            </div>

            <button
              onClick={resetQuestions}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t.restartQuestions}</span>
            </button>
          </div>
        </div>
      )}

      {/* Action Footer: Snap another note or copy full guide */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          onClick={onRetake}
          className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 active:scale-95 transition flex items-center justify-center gap-2"
        >
          <Camera className="w-4 h-4" />
          <span>{t.snapAnother}</span>
        </button>

        <button
          onClick={() => copyToClipboard(getFullGuideText(), 'all')}
          className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm active:scale-95 transition flex items-center justify-center gap-2"
        >
          {copiedType === 'all' ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-600">{t.copied}</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span>{t.copyAll}</span>
            </>
          )}
        </button>
      </div>

      {/* Lightbox Modal for Original Photo */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col justify-between p-4 animate-fadeIn">
          <div className="flex justify-end p-2">
            <button
              onClick={() => setShowPhotoModal(false)}
              className="py-1.5 px-4 rounded-full bg-white/20 text-white text-xs font-semibold hover:bg-white/30 transition"
            >
              {t.closePhoto}
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-auto p-2">
            <img
              src={photoUrl}
              alt="Full size study notes"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
