import React, { useState } from 'react';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { useToast } from '../context/ToastContext';
import { Sparkles, FileText, CheckCircle2, ChevronRight, Wand2 } from 'lucide-react';

interface Project {
  id: string;
  name: string;
}

interface AiLabPageProps {
  projects: Project[];
}

export const AiLabPage: React.FC<AiLabPageProps> = ({ projects }) => {
  const { addToast } = useToast();

  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [rawNotes, setRawNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [taskCreationLoading, setTaskCreationLoading] = useState(false);
  const [createdCount, setCreatedCount] = useState<number | null>(null);

  const handleAnalyzeNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawNotes.trim()) {
      return addToast('Please enter some meeting transcript text', 'warning');
    }

    setLoading(true);
    setSummary('');
    setCreatedCount(null);

    try {
      const res = await api.post('/ai/meeting-notes', { notes: rawNotes });
      setSummary(res.data.summary);
      addToast('Transcript analyzed successfully!', 'success');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to analyze meeting notes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTasks = async () => {
    if (!selectedProjectId) {
      return addToast('Please select a destination project first', 'warning');
    }
    if (!summary) return;

    setTaskCreationLoading(true);

    try {
      const res = await api.post('/ai/create-tasks-from-notes', {
        projectId: selectedProjectId,
        summaryText: summary
      });
      setCreatedCount(res.data.tasks.length);
      addToast(`Action Items successfully created as ${res.data.tasks.length} tasks!`, 'success');
      // Optional: Clear notes
      setRawNotes('');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to auto-create tasks', 'error');
    } finally {
      setTaskCreationLoading(false);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-6 h-full overflow-y-auto max-w-5xl mx-auto select-none">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-zinc-50 tracking-tight flex items-center gap-2">
          <Sparkles size={18} className="text-indigo-400" />
          AI Developer Lab
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Convert unstructured meeting logs or code requirements lists into automated Kanban tasks</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start mt-2">
        {/* Input Form Column (Left) */}
        <form onSubmit={handleAnalyzeNotes} className="lg:col-span-2 flex flex-col gap-4">
          <Card className="p-5 flex flex-col gap-4 bg-zinc-900/10 border-zinc-800 glass-panel">
            <div>
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Raw Input Logs</h3>
              <p className="text-[9px] text-zinc-500 mt-0.5">Paste raw meeting chats, standup comments, or transcript files</p>
            </div>

            <textarea
              placeholder="e.g. Bob said he will build express routers for auth. Alice will draw the stitch wireframe style and design token parameters. Charlie agreed to build the drag-drop kanban board..."
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              rows={9}
              className="w-full bg-zinc-950 border border-zinc-850 text-xs text-zinc-350 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed select-text"
              required
            />

            <Button type="submit" variant="primary" className="w-full mt-1" isLoading={loading}>
              <Wand2 size={13} className="mr-1.5" /> Analyze Transcript
            </Button>
          </Card>
        </form>

        {/* Results Action Column (Right) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {summary ? (
            <Card className="p-5 flex flex-col gap-5 bg-zinc-900/15 border-zinc-800 glass-panel">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={13} className="text-indigo-400 animate-pulse" />
                    AI Action Plan Insights
                  </h3>
                  <p className="text-[9px] text-zinc-500 mt-0.5">Parsed action items and tasks derived from meeting notes</p>
                </div>
              </div>

              {/* Summary Text (Parsed markdown-like block) */}
              <div className="bg-zinc-950/65 border border-zinc-850 p-4 rounded-xl text-xs text-zinc-350 leading-relaxed max-h-72 overflow-y-auto select-text font-medium">
                {summary.split('\n').map((line, i) => {
                  if (line.startsWith('###')) {
                    return <h4 key={i} className="text-xs font-bold text-zinc-50 mt-3 mb-1 first:mt-0">{line.replace('###', '')}</h4>;
                  }
                  if (line.startsWith('-')) {
                    // Check if line contains user mentions
                    return (
                      <div key={i} className="flex items-start gap-2 mt-1.5 pl-2">
                        <ChevronRight size={12} className="text-indigo-500 shrink-0 mt-0.5" />
                        <span dangerouslySetInnerHTML={{ 
                          __html: line.replace('-', '')
                            .replace(/\*\*@(\w+)\*\*/g, '<span class="text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.2 rounded-md">@$1</span>') 
                        }} />
                      </div>
                    );
                  }
                  return <p key={i} className="mt-2">{line}</p>;
                })}
              </div>

              {/* Conversion Block */}
              {createdCount === null ? (
                <div className="flex flex-col gap-3.5 border-t border-zinc-850 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Destination Kanban Project"
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      options={[
                        { value: '', label: 'Select Project...' },
                        ...projects.map((p) => ({ value: p.id, label: p.name }))
                      ]}
                    />
                  </div>

                  <Button 
                    onClick={handleCreateTasks}
                    variant="glass" 
                    className="w-full text-indigo-400 font-semibold border-indigo-500/25 hover:bg-indigo-500/[0.04]"
                    isLoading={taskCreationLoading}
                    disabled={!selectedProjectId}
                  >
                    <CheckCircle2 size={13} className="mr-1.5" /> Automate Action items as Active Board Tasks
                  </Button>
                </div>
              ) : (
                <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4 flex gap-3.5 items-start mt-1">
                  <CheckCircle2 size={18} className="text-emerald-450 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-400">Tasks Successfully Automated!</h4>
                    <p className="text-[10px] text-zinc-450 mt-1 leading-relaxed">
                      Generated {createdCount} actionable tasks based on these notes and injected them directly into the selected project board in standard TODO status.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="h-64 flex flex-col justify-center items-center text-center p-6 border border-dashed border-zinc-850 bg-zinc-950/5 rounded-2xl select-none">
              <FileText size={24} className="text-zinc-650 mb-3" />
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Awaiting Analysis</h3>
              <p className="text-[10px] text-zinc-550 max-w-sm mt-1 leading-relaxed">
                Paste meeting transcript details or minutes notes on the left panel and click Analyze to review summary action items.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
