/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Upload,
  Globe,
  Sparkles,
  BookOpen,
  History,
  Trash2,
  ChevronRight,
  AlertCircle,
  X,
  FileText,
  Clock,
  ArrowRight,
  FolderPlus,
  Folder,
  Layers,
  GraduationCap
} from 'lucide-react';
import { AnalysisResult, Language, StoredScan, Project } from './types';
import { getT } from './i18n';
import { CameraView } from './components/CameraView';
import { StudyResults } from './components/StudyResults';
import { ProjectManagerModal, getProjectTheme, getProjectIconComponent } from './components/ProjectManagerModal';
import { sampleNotesList } from './sampleNotes';

const STORAGE_KEY = 'studysnap_history_v1';
const LANG_STORAGE_KEY = 'studysnap_lang_pref';
const PROJECTS_STORAGE_KEY = 'studysnap_projects_v1';
const ACTIVE_PROJECT_KEY = 'studysnap_active_proj_v1';

const INITIAL_STARTER_PROJECTS: Project[] = [
  {
    id: 'proj-bio',
    name: 'Biology 101',
    description: 'Bioenergetics & Cellular Systems',
    color: 'emerald',
    icon: 'microscope',
    customInstructions: 'Focus on biological terms, cellular pathways, and exam definitions.',
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'proj-calc',
    name: 'Calculus & Math',
    description: 'Derivatives & Chain Rule',
    color: 'indigo',
    icon: 'calculator',
    customInstructions: 'Focus on formulas, calculus rules, and stepwise problem solving.',
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'proj-hist',
    name: 'World History',
    description: 'Modern Era & Industrialization',
    color: 'amber',
    icon: 'landmark',
    customInstructions: 'Emphasize causes, key inventions, social impacts, and timeline recall.',
    createdAt: Date.now() - 86400000 * 1,
  },
];

export default function App() {
  // Language preference with persistent storage
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'es' || saved === 'en') return saved;
    return navigator.language.startsWith('es') ? 'es' : 'en';
  });

  const t = getT(language);

  // Projects state
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
      return INITIAL_STARTER_PROJECTS;
    } catch {
      return INITIAL_STARTER_PROJECTS;
    }
  });

  // Active Project (null = All Projects)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    return localStorage.getItem(ACTIVE_PROJECT_KEY) || null;
  });

  const [showProjectModal, setShowProjectModal] = useState<boolean>(false);

  // App navigation state: 'home' | 'camera' | 'results'
  const [viewState, setViewState] = useState<'home' | 'camera' | 'results'>('home');
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<StoredScan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // File input refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Persist projects
  const saveProjects = (updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    try {
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(updatedProjects));
    } catch (e) {
      console.warn('Failed to save projects to localStorage:', e);
    }
  };

  const handleCreateProject = (newProjData: Omit<Project, 'id' | 'createdAt'>) => {
    const newProj: Project = {
      ...newProjData,
      id: `proj-${Date.now()}`,
      createdAt: Date.now(),
    };
    const updated = [newProj, ...projects];
    saveProjects(updated);
    setActiveProjectId(newProj.id);
    localStorage.setItem(ACTIVE_PROJECT_KEY, newProj.id);
  };

  const handleDeleteProject = (projId: string) => {
    const updatedProjects = projects.filter((p) => p.id !== projId);
    saveProjects(updatedProjects);

    // Re-assign scans in that project to general
    const updatedHistory = history.map((scan) => {
      if (scan.projectId === projId) {
        return { ...scan, projectId: undefined };
      }
      return scan;
    });
    setHistory(updatedHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));

    if (activeProjectId === projId) {
      setActiveProjectId(null);
      localStorage.removeItem(ACTIVE_PROJECT_KEY);
    }
  };

  const handleSelectActiveProject = (projId: string | null) => {
    setActiveProjectId(projId);
    if (projId) {
      localStorage.setItem(ACTIVE_PROJECT_KEY, projId);
    } else {
      localStorage.removeItem(ACTIVE_PROJECT_KEY);
    }
  };

  // Re-assign scan to a different project
  const handleMoveScanToProject = (scanId: string | null, targetProjId: string | null) => {
    if (!scanId) return;
    const updatedHistory = history.map((scan) => {
      if (scan.id === scanId) {
        return { ...scan, projectId: targetProjId || undefined };
      }
      return scan;
    });
    setHistory(updatedHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  };

  // Save language changes
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  };

  // Save history to localStorage
  const saveToHistory = (result: AnalysisResult, image: string, lang: Language, projId?: string | null) => {
    if (!result.isStudyNotes) return;

    const newScanId = String(Date.now());
    const newScan: StoredScan = {
      id: newScanId,
      projectId: projId || undefined,
      timestamp: Date.now(),
      title: result.title || 'Untitled Notes',
      subject: result.subject,
      language: lang,
      imageThumbnail: image,
      result,
    };

    setCurrentScanId(newScanId);

    const updated = [newScan, ...history.filter((h) => h.title !== newScan.title)].slice(0, 30);
    setHistory(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const clearAllHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
    setShowHistoryModal(false);
  };

  // Active Project Entity
  const activeProject = projects.find((p) => p.id === activeProjectId);

  // Call the server Gemini endpoint
  const analyzeImage = async (dataUrl: string, selectedLang: Language = language, targetProjId: string | null = activeProjectId) => {
    setCurrentImage(dataUrl);
    setIsAnalyzing(true);
    setApiError(null);
    setViewState('results');

    try {
      // Build project context string for Gemini prompt
      let projectContext: string | undefined = undefined;
      const proj = projects.find((p) => p.id === targetProjId);
      if (proj) {
        projectContext = `${proj.name}${proj.description ? ` (${proj.description})` : ''}${
          proj.customInstructions ? ` • Instructions: ${proj.customInstructions}` : ''
        }`;
      }

      const response = await fetch('/api/analyze-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: dataUrl,
          mimeType: 'image/jpeg',
          language: selectedLang,
          projectContext,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || t.errorAnalyzing);
      }

      const result: AnalysisResult = resData.data;
      setAnalysisResult(result);

      if (result.isStudyNotes) {
        saveToHistory(result, dataUrl, selectedLang, targetProjId);
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      setApiError(error.message || t.errorAnalyzing);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle image capture from CameraView
  const handleCameraCapture = (capturedDataUrl: string) => {
    setViewState('home');
    analyzeImage(capturedDataUrl, language, activeProjectId);
  };

  // Handle file/photo selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        analyzeImage(dataUrl, language, activeProjectId);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle sample note selection with automatic project matching
  const handleSelectSample = (sample: typeof sampleNotesList[0]) => {
    const dataUrl = sample.generator();
    if (sample.defaultLang !== language) {
      handleLanguageChange(sample.defaultLang);
    }

    // Match sample to relevant project if available
    let sampleProjId: string | null = activeProjectId;
    if (sample.id === 'bio-respiration' && projects.some((p) => p.id === 'proj-bio')) {
      sampleProjId = 'proj-bio';
    } else if (sample.id === 'calc-derivatives' && projects.some((p) => p.id === 'proj-calc')) {
      sampleProjId = 'proj-calc';
    } else if (sample.id === 'history-revolution' && projects.some((p) => p.id === 'proj-hist')) {
      sampleProjId = 'proj-hist';
    }

    analyzeImage(dataUrl, sample.defaultLang, sampleProjId);
  };

  const handleRetake = () => {
    setViewState('camera');
    setAnalysisResult(null);
    setApiError(null);
  };

  // Filter notes based on active project
  const filteredHistory = activeProjectId
    ? history.filter((h) => h.projectId === activeProjectId)
    : history;

  // Active project visual styling
  const activeTheme = activeProject ? getProjectTheme(activeProject.color) : null;
  const ActiveIcon = activeProject ? getProjectIconComponent(activeProject.icon) : Folder;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Main Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          {/* Logo & Name */}
          <button
            onClick={() => {
              setViewState('home');
              setAnalysisResult(null);
            }}
            className="flex items-center gap-2 text-left group flex-shrink-0"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="hidden xs:block sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-slate-900 dark:text-slate-100 tracking-tight">
                  StudySnap
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 dark:bg-indigo-900/70 text-indigo-700 dark:text-indigo-300">
                  AI
                </span>
              </div>
            </div>
          </button>

          {/* Center: Active Project Pill Selector */}
          <button
            onClick={() => setShowProjectModal(true)}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition max-w-[160px] sm:max-w-[220px]"
            title={t.manageProjects}
          >
            {activeProject ? (
              <>
                <span className={`w-2 h-2 rounded-full ${activeTheme?.bg}`} />
                <ActiveIcon className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
                <span className="truncate">{activeProject.name}</span>
              </>
            ) : (
              <>
                <Folder className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                <span className="truncate">{t.allProjects}</span>
              </>
            )}
            <span className="text-[10px] text-slate-400 ml-0.5">▾</span>
          </button>

          {/* Right Header Actions: History Button & Language Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* History Button */}
            <button
              onClick={() => setShowHistoryModal(true)}
              type="button"
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={t.savedHistory}
              aria-label={t.savedHistory}
            >
              <History className="w-5 h-5" />
              {history.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {/* Language Selector Pill Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-2 py-1 rounded-lg transition ${
                  language === 'en'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Switch to English"
              >
                EN
              </button>
              <button
                onClick={() => handleLanguageChange('es')}
                className={`px-2 py-1 rounded-lg transition ${
                  language === 'es'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Cambiar a Español"
              >
                ES
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto pb-12">
        {/* ======================================================= */}
        {/* VIEW 1: HOME DASHBOARD                                  */}
        {/* ======================================================= */}
        {viewState === 'home' && (
          <div className="px-4 py-6 sm:py-10 space-y-7 animate-fadeIn">
            {/* Project Tabs Strip */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
              <button
                onClick={() => handleSelectActiveProject(null)}
                className={`px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 whitespace-nowrap transition flex-shrink-0 ${
                  activeProjectId === null
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>{t.allNotes}</span>
                <span className="opacity-75">({history.length})</span>
              </button>

              {projects.map((proj) => {
                const isSelected = activeProjectId === proj.id;
                const pTheme = getProjectTheme(proj.color);
                const PIcon = getProjectIconComponent(proj.icon);
                const count = history.filter((h) => h.projectId === proj.id).length;

                return (
                  <button
                    key={proj.id}
                    onClick={() => handleSelectActiveProject(proj.id)}
                    className={`px-3 py-1.5 rounded-full font-semibold flex items-center gap-1.5 whitespace-nowrap transition flex-shrink-0 ${
                      isSelected
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm ring-2 ring-indigo-500'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${pTheme.bg}`} />
                    <PIcon className="w-3.5 h-3.5" />
                    <span>{proj.name}</span>
                    <span className="opacity-75">({count})</span>
                  </button>
                );
              })}

              <button
                onClick={() => setShowProjectModal(true)}
                className="px-3 py-1.5 rounded-full font-semibold flex items-center gap-1 whitespace-nowrap bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 transition flex-shrink-0"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>+ {t.newProject}</span>
              </button>
            </div>

            {/* Active Project Banner (if filtered) */}
            {activeProject ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl ${activeTheme?.bg} text-white flex items-center justify-center shadow-md flex-shrink-0`}>
                      <ActiveIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          {t.currentProject}
                        </span>
                        {activeProject.customInstructions && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            {language === 'es' ? 'Instrucciones IA activas' : 'AI Instructions active'}
                          </span>
                        )}
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                        {activeProject.name}
                      </h2>
                      {activeProject.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{activeProject.description}</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setShowProjectModal(true)}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex-shrink-0"
                  >
                    {language === 'es' ? 'Cambiar' : 'Manage'}
                  </button>
                </div>

                {activeProject.customInstructions && (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 leading-relaxed">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">💡 Custom AI Focus: </span>
                    {activeProject.customInstructions}
                  </div>
                )}
              </div>
            ) : (
              /* Hero Intro (When viewing All Notes) */
              <div className="text-center space-y-3 max-w-lg mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>
                    {language === 'es'
                      ? 'Organiza por Materias & Clases'
                      : 'Projects for Classes, Subjects & Assignments'}
                  </span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                  {language === 'es' ? 'Tus apuntes, explicados.' : 'Turn any notes into instant study mastery.'}
                </h2>

                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t.appTagline}
                </p>
              </div>
            )}

            {/* Primary Action Buttons (Mobile-first large touch targets) */}
            <div className="max-w-md mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {/* Take Photo with Camera */}
              <button
                onClick={() => setViewState('camera')}
                type="button"
                className="group relative p-5 rounded-3xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white shadow-xl shadow-indigo-600/25 transition flex flex-col items-center justify-center text-center gap-3 sm:col-span-2"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-lg font-bold block">
                    {activeProject
                      ? `${t.takePhoto} • ${activeProject.name}`
                      : t.takePhoto}
                  </span>
                  <span className="text-xs text-indigo-100/90 font-normal">
                    {language === 'es'
                      ? 'Abre la cámara para escanear tu hoja'
                      : 'Live viewfinder or native phone camera'}
                  </span>
                </div>
              </button>

              {/* Native Camera App trigger */}
              <button
                onClick={() => nativeCameraInputRef.current?.click()}
                type="button"
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 active:scale-98 shadow-sm transition flex items-center gap-3.5 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">
                    {t.useNativeCamera}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {language === 'es' ? 'Cámara de iPhone/Android' : 'Direct mobile hardware camera'}
                  </span>
                </div>
              </button>

              {/* Upload from Gallery / Files */}
              <button
                onClick={() => fileInputRef.current?.click()}
                type="button"
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 active:scale-98 shadow-sm transition flex items-center gap-3.5 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center flex-shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 block">
                    {t.uploadPhoto}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {language === 'es' ? 'Selecciona una foto guardada' : 'Select from photo library'}
                  </span>
                </div>
              </button>
            </div>

            {/* Quick Sample Notes Section */}
            <div className="max-w-xl mx-auto pt-3 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  {t.trySample}
                </span>
                <span className="text-xs text-slate-400">
                  {language === 'es' ? 'Prueba con 1 toque' : '1-tap test notes'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sampleNotesList.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    type="button"
                    className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:shadow-md transition active:scale-98 text-left group flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-tight block">
                        {sample.category}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors block">
                        {t[sample.titleKey]}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
                  </button>
                ))}
              </div>
            </div>

            {/* Notes List for the Selected Project or All */}
            <div className="max-w-xl mx-auto pt-3 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  {activeProject
                    ? `${activeProject.name} (${filteredHistory.length})`
                    : `${t.allNotes} (${filteredHistory.length})`}
                </span>
                {filteredHistory.length > 0 && (
                  <button
                    onClick={() => setShowHistoryModal(true)}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {language === 'es' ? 'Ver todo' : 'View all'}
                  </button>
                )}
              </div>

              {filteredHistory.length === 0 ? (
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-xs text-slate-500">
                    {activeProject ? t.noNotesInProject : t.noHistory}
                  </p>
                  <button
                    onClick={() => setViewState('camera')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 transition"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{t.takePhoto}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredHistory.slice(0, 5).map((item) => {
                    const itemProj = projects.find((p) => p.id === item.projectId);
                    const itemTheme = itemProj ? getProjectTheme(itemProj.color) : null;

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setAnalysisResult(item.result);
                          setCurrentImage(item.imageThumbnail);
                          setCurrentScanId(item.id);
                          setLanguage(item.language);
                          setViewState('results');
                        }}
                        className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 cursor-pointer hover:border-indigo-300 transition shadow-sm"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <img
                            src={item.imageThumbnail}
                            alt={item.title}
                            className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700"
                          />
                          <div className="truncate">
                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                              {item.title}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                              {itemProj && (
                                <span className={`px-1.5 py-0.2 rounded font-semibold text-white ${itemTheme?.bg}`}>
                                  {itemProj.name}
                                </span>
                              )}
                              {item.subject && <span>{item.subject}</span>}
                              <span>•</span>
                              <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* VIEW 2: CAMERA VIEW (Full Screen Overlay)                */}
        {/* ======================================================= */}
        {viewState === 'camera' && (
          <CameraView
            language={language}
            onCapture={handleCameraCapture}
            onClose={() => setViewState('home')}
            onSelectSample={(sampleData) => {
              setViewState('home');
              analyzeImage(sampleData, language, activeProjectId);
            }}
          />
        )}

        {/* ======================================================= */}
        {/* VIEW 3: RESULTS / ANALYZING STATE                        */}
        {/* ======================================================= */}
        {viewState === 'results' && (
          <div>
            {/* Analyzing Spinner Screen */}
            {isAnalyzing && (
              <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6 animate-fadeIn">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-indigo-950 animate-ping opacity-30" />
                  <div className="w-full h-full rounded-full border-4 border-indigo-600 border-t-transparent animate-spin flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                    {t.analyzing}
                  </h3>
                  {activeProject && (
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      📁 {activeProject.name}
                    </p>
                  )}
                  <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                    {t.analyzingSubtitle}
                  </p>
                </div>

                {/* Preview of thumbnail being scanned */}
                {currentImage && (
                  <div className="relative mx-auto w-40 h-48 rounded-2xl overflow-hidden border-2 border-indigo-500/30 shadow-lg">
                    <img src={currentImage} alt="Scanning notes" className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_12px_#6366f1] animate-[bounce_2s_infinite]" />
                  </div>
                )}
              </div>
            )}

            {/* API Error Screen */}
            {!isAnalyzing && apiError && (
              <div className="max-w-md mx-auto px-4 py-12 text-center space-y-4 animate-fadeIn">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {t.errorAnalyzing}
                </h3>
                <p className="text-xs text-slate-500 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-900 text-left">
                  {apiError}
                </p>
                <div className="flex gap-2 justify-center pt-2">
                  <button
                    onClick={() => {
                      if (currentImage) analyzeImage(currentImage, language, activeProjectId);
                      else setViewState('home');
                    }}
                    className="py-2.5 px-5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow hover:bg-indigo-700 active:scale-95 transition"
                  >
                    {language === 'es' ? 'Reintentar' : 'Try Again'}
                  </button>
                  <button
                    onClick={() => setViewState('home')}
                    className="py-2.5 px-5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-300 transition"
                  >
                    {language === 'es' ? 'Volver al Inicio' : 'Back to Home'}
                  </button>
                </div>
              </div>
            )}

            {/* Success Results Screen */}
            {!isAnalyzing && analysisResult && (
              <StudyResults
                result={analysisResult}
                photoUrl={currentImage || ''}
                language={language}
                projectId={history.find((h) => h.id === currentScanId)?.projectId || activeProjectId}
                projects={projects}
                onMoveProject={(newProjId) => {
                  handleMoveScanToProject(currentScanId, newProjId);
                  if (newProjId && newProjId !== activeProjectId) {
                    setActiveProjectId(newProjId);
                  }
                }}
                onRetake={handleRetake}
                onSelectSample={() => {
                  const sample = sampleNotesList[0];
                  handleSelectSample(sample);
                }}
              />
            )}
          </div>
        )}
      </main>

      {/* ======================================================= */}
      {/* PROJECT MANAGER MODAL                                   */}
      {/* ======================================================= */}
      <ProjectManagerModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={handleSelectActiveProject}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        history={history}
        language={language}
      />

      {/* ======================================================= */}
      {/* HISTORY DRAWER / MODAL                                  */}
      {/* ======================================================= */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100">
                  {t.savedHistory}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button
                    onClick={clearAllHistory}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium"
                  >
                    {t.clearHistory}
                  </button>
                )}
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="p-4 flex-1 overflow-y-auto space-y-2">
              {history.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <FileText className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    {t.noHistory}
                  </p>
                </div>
              ) : (
                history.map((item) => {
                  const itemProj = projects.find((p) => p.id === item.projectId);
                  const itemTheme = itemProj ? getProjectTheme(itemProj.color) : null;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setAnalysisResult(item.result);
                        setCurrentImage(item.imageThumbnail);
                        setCurrentScanId(item.id);
                        setLanguage(item.language);
                        setViewState('results');
                        setShowHistoryModal(false);
                      }}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl flex items-center justify-between gap-3 cursor-pointer hover:border-indigo-400 transition"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img
                          src={item.imageThumbnail}
                          alt={item.title}
                          className="w-12 h-12 rounded-xl object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700"
                        />
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {item.title}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                            {itemProj && (
                              <span className={`px-1.5 py-0.2 rounded font-semibold text-white ${itemTheme?.bg}`}>
                                {itemProj.name}
                              </span>
                            )}
                            {item.subject && <span>{item.subject}</span>}
                            <span>•</span>
                            <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                            <span className="uppercase font-semibold text-indigo-500">
                              {item.language}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => deleteHistoryItem(item.id, e)}
                          className="p-2 text-slate-400 hover:text-rose-500 transition"
                          title={t.deleteHistory}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
