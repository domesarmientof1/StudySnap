import React, { useState } from 'react';
import {
  FolderPlus,
  Folder,
  X,
  Check,
  Trash2,
  Sparkles,
  BookOpen,
  GraduationCap,
  Calculator,
  Microscope,
  Landmark,
  Code2,
  FileText,
  ChevronRight,
  Info
} from 'lucide-react';
import { Project, Language, StoredScan } from '../types';
import { getT } from '../i18n';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  onCreateProject: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  onDeleteProject: (projectId: string) => void;
  history: StoredScan[];
  language: Language;
}

export const PROJECT_COLORS = [
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-500', text: 'text-indigo-600', ring: 'ring-indigo-400', light: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500', text: 'text-emerald-600', ring: 'ring-emerald-400', light: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  { id: 'violet', label: 'Violet', bg: 'bg-violet-500', text: 'text-violet-600', ring: 'ring-violet-400', light: 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-500', text: 'text-amber-600', ring: 'ring-amber-400', light: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-500', text: 'text-rose-600', ring: 'ring-rose-400', light: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
  { id: 'sky', label: 'Sky', bg: 'bg-sky-500', text: 'text-sky-600', ring: 'ring-sky-400', light: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800' },
  { id: 'teal', label: 'Teal', bg: 'bg-teal-500', text: 'text-teal-600', ring: 'ring-teal-400', light: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800' },
];

export const PROJECT_ICONS = [
  { id: 'book', label: 'Book', Icon: BookOpen },
  { id: 'microscope', label: 'Science', Icon: Microscope },
  { id: 'calculator', label: 'Math', Icon: Calculator },
  { id: 'landmark', label: 'History', Icon: Landmark },
  { id: 'grad', label: 'Course', Icon: GraduationCap },
  { id: 'code', label: 'Tech', Icon: Code2 },
  { id: 'doc', label: 'Notes', Icon: FileText },
];

export function getProjectTheme(colorId?: string) {
  return PROJECT_COLORS.find((c) => c.id === colorId) || PROJECT_COLORS[0];
}

export function getProjectIconComponent(iconId?: string) {
  const match = PROJECT_ICONS.find((i) => i.id === iconId);
  return match ? match.Icon : Folder;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  history,
  language,
}) => {
  const t = getT(language);

  const [mode, setMode] = useState<'list' | 'create'>('list');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [selectedColor, setSelectedColor] = useState('indigo');
  const [selectedIcon, setSelectedIcon] = useState('book');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateProject({
      name: name.trim(),
      description: description.trim() || undefined,
      customInstructions: customInstructions.trim() || undefined,
      color: selectedColor,
      icon: selectedIcon,
    });

    setName('');
    setDescription('');
    setCustomInstructions('');
    setMode('list');
  };

  const getNotesCount = (projId: string | null) => {
    if (projId === null) return history.length;
    return history.filter((h) => h.projectId === projId).length;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="w-full sm:max-w-xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Folder className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {mode === 'create' ? t.newProject : t.projects}
              </h3>
              <p className="text-xs text-slate-500">
                {mode === 'create'
                  ? (language === 'es' ? 'Organiza materias, clases o tareas' : 'Organize by class, subject, or assignment')
                  : (language === 'es' ? 'Selecciona o gestiona tus carpetas' : 'Switch or manage your course folders')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mode === 'list' ? (
              <button
                onClick={() => setMode('create')}
                className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 active:scale-95 transition"
              >
                <FolderPlus className="w-4 h-4" />
                <span>{t.newProject}</span>
              </button>
            ) : (
              <button
                onClick={() => setMode('list')}
                className="py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition"
              >
                {language === 'es' ? 'Volver' : 'Back'}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto">
          {/* ==================================================== */}
          {/* MODE 1: CREATE PROJECT FORM                          */}
          {/* ==================================================== */}
          {mode === 'create' ? (
            <form onSubmit={handleCreate} className="space-y-4">
              {/* Project Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                  {t.projectName} *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.projectNamePlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              {/* Course / Term */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
                  {t.projectDescription}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.projectDescriptionPlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Custom AI Instructions (ChatGPT Projects style) */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    {t.projectCustomInstructions}
                  </label>
                </div>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder={t.projectCustomInstructionsPlaceholder}
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  {language === 'es'
                    ? 'Gemini usará estas instrucciones para enfocar los resúmenes y preguntas de esta clase.'
                    : 'Gemini will use these instructions when analyzing any notes for this project.'}
                </p>
              </div>

              {/* Color Theme Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                  {t.projectColor}
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {PROJECT_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedColor(c.id)}
                      className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center transition-transform active:scale-90 ${
                        selectedColor === c.id ? `ring-4 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900 scale-110` : 'opacity-85 hover:opacity-100'
                      }`}
                      title={c.label}
                    >
                      {selectedColor === c.id && <Check className="w-4 h-4 text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                  {language === 'es' ? 'Icono' : 'Icon'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_ICONS.map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedIcon(id)}
                      className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition ${
                        selectedIcon === id
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 active:scale-95 transition"
                >
                  {t.createProject}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-200 transition"
                >
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
              </div>
            </form>
          ) : (
            /* ==================================================== */
            /* MODE 2: PROJECTS LIST & SELECTOR                     */
            /* ==================================================== */
            <div className="space-y-3">
              {/* Option 1: All Projects (Global) */}
              <div
                onClick={() => {
                  onSelectProject(null);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                  activeProjectId === null
                    ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                    <Folder className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {t.allProjects}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {t.notesCount.replace('{count}', String(getNotesCount(null)))}
                    </p>
                  </div>
                </div>

                {activeProjectId === null && (
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                    <Check className="w-4 h-4" />
                  </span>
                )}
              </div>

              {/* Custom Projects */}
              {projects.map((project) => {
                const theme = getProjectTheme(project.color);
                const IconComponent = getProjectIconComponent(project.icon);
                const isSelected = activeProjectId === project.id;
                const count = getNotesCount(project.id);

                return (
                  <div
                    key={project.id}
                    onClick={() => {
                      onSelectProject(project.id);
                      onClose();
                    }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition group flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-sm ring-1 ring-indigo-500/50'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-10 h-10 rounded-xl ${theme.bg} text-white flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <IconComponent className="w-5 h-5" />
                      </div>

                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                            {project.name}
                          </h4>
                          {project.customInstructions && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center gap-0.5" title={project.customInstructions}>
                              <Sparkles className="w-2.5 h-2.5" />
                              AI
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {project.description && <span className="truncate">{project.description} • </span>}
                          <span>{t.notesCount.replace('{count}', String(count))}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isSelected ? (
                        <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                          <Check className="w-4 h-4" />
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(t.deleteProjectConfirm)) {
                              onDeleteProject(project.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 transition"
                          title={t.deleteProject}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {projects.length === 0 && (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-500 flex items-center justify-center">
                    <FolderPlus className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                    {t.noProjects}
                  </p>
                  <button
                    onClick={() => setMode('create')}
                    className="py-2 px-4 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition"
                  >
                    {t.createProject}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
