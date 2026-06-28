import React, { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { 
  X, Trash2, Plus, Sparkles, Send, Save, ThumbsUp, FileText, Paperclip
} from 'lucide-react';

interface TaskDetailModalProps {
  taskId: string;
  onClose: () => void;
  onTaskUpdate: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ taskId, onClose, onTaskUpdate }) => {
  const { user } = useAuth();
  const [task, setTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable fields
  const [title, setTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [desc, setDesc] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  
  // Checklist & Comment forms
  const [newCheckItem, setNewCheckItem] = useState('');
  const [newComment, setNewComment] = useState('');
  const [commentReplyParentId, setCommentReplyParentId] = useState<string | null>(null);

  // AI Loading indicators
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReasoning, setAiReasoning] = useState('');

  // File Upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTaskDetails = async () => {
    try {
      const res = await api.get(`/tasks/${taskId}`);
      setTask(res.data);
      setTitle(res.data.title);
      setDesc(res.data.description || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchTaskDetails();
  }, [taskId]);

  const handleUpdateField = async (fields: Record<string, any>) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, fields);
      setTask((prev: any) => ({ ...prev, ...res.data }));
      onTaskUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveTitle = () => {
    if (title.trim() && title !== task.title) {
      handleUpdateField({ title });
    }
    setIsEditingTitle(false);
  };

  const handleSaveDesc = () => {
    handleUpdateField({ description: desc });
    setIsEditingDesc(false);
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      onTaskUpdate();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  // Checklist Actions
  const handleAddCheckItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckItem.trim()) return;

    try {
      const res = await api.post(`/tasks/${taskId}/checklist`, { title: newCheckItem });
      setTask((prev: any) => ({
        ...prev,
        checklists: [...(prev.checklists || []), res.data]
      }));
      setNewCheckItem('');
      onTaskUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleCheckItem = async (itemId: string, isCompleted: boolean) => {
    try {
      const res = await api.put(`/tasks/checklist/${itemId}`, { isCompleted });
      setTask((prev: any) => ({
        ...prev,
        checklists: prev.checklists.map((c: any) => (c.id === itemId ? res.data : c))
      }));
      onTaskUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCheckItem = async (itemId: string) => {
    try {
      await api.delete(`/tasks/checklist/${itemId}`);
      setTask((prev: any) => ({
        ...prev,
        checklists: prev.checklists.filter((c: any) => c.id !== itemId)
      }));
      onTaskUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  // Comments Actions
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await api.post('/comments', {
        taskId,
        content: newComment,
        parentId: commentReplyParentId
      });
      setTask((prev: any) => ({
        ...prev,
        comments: [...(prev.comments || []), res.data]
      }));
      setNewComment('');
      setCommentReplyParentId(null);
      onTaskUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCommentReaction = async (commentId: string, emoji: string) => {
    try {
      const res = await api.post(`/comments/${commentId}/react`, { emoji });
      setTask((prev: any) => ({
        ...prev,
        comments: prev.comments.map((c: any) => {
          if (c.id === commentId) {
            return { ...c, reactions: res.data };
          }
          return c;
        })
      }));
    } catch (err) {
      console.error(err);
    }
  };

  // File Upload
  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/tasks/${taskId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTask((prev: any) => ({
        ...prev,
        attachments: [...(prev.attachments || []), res.data]
      }));
      onTaskUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await api.delete(`/tasks/attachments/${attachmentId}`);
      setTask((prev: any) => ({
        ...prev,
        attachments: prev.attachments.filter((a: any) => a.id !== attachmentId)
      }));
      onTaskUpdate();
    } catch (err) {
      console.error(err);
    }
  };

  // AI Helper Commands
  const handleAIGenerateDescription = async () => {
    setAiLoading(true);
    setAiReasoning('');
    try {
      const res = await api.post('/ai/description', { title: task.title });
      setDesc(res.data.description);
      setIsEditingDesc(true);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAISuggestSubtasks = async () => {
    setAiLoading(true);
    setAiReasoning('');
    try {
      const res = await api.post('/ai/subtasks', { title: task.title });
      const suggestions = res.data.subtasks;
      for (const itemTitle of suggestions) {
        const itemRes = await api.post(`/tasks/${taskId}/checklist`, { title: itemTitle });
        setTask((prev: any) => ({
          ...prev,
          checklists: [...(prev.checklists || []), itemRes.data]
        }));
      }
      onTaskUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAISuggestPriority = async () => {
    setAiLoading(true);
    setAiReasoning('');
    try {
      const res = await api.post('/ai/priority', { title: task.title, description: desc });
      handleUpdateField({ priority: res.data.priority });
      setAiReasoning(`AI priority suggestion: ${res.data.priority}. Reasoning: ${res.data.reasoning}`);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAITaskSummary = async () => {
    setAiLoading(true);
    setAiReasoning('');
    try {
      const res = await api.post('/ai/summary', { taskDetails: task });
      setAiReasoning(`AI Task Summary: ${res.data.summary}`);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex justify-end">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" />
        <div className="w-full max-w-2xl bg-zinc-900 border-l border-zinc-800 h-full p-6 animate-pulse flex flex-col gap-6 relative z-10">
          <div className="h-6 bg-zinc-800 rounded w-1/3" />
          <div className="h-40 bg-zinc-800 rounded w-full" />
          <div className="h-32 bg-zinc-800 rounded w-full" />
        </div>
      </div>
    );
  }

  const commentThreads = task.comments.filter((c: any) => !c.parentId);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      {/* Drawer Surface */}
      <div className="w-full max-w-2xl bg-zinc-900 border-l border-zinc-800 h-full flex flex-col shadow-2xl relative z-10">
        
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-zinc-850 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-zinc-550 text-xs font-semibold">
            <span>Tasks</span>
            <span>/</span>
            <span className="text-zinc-400 truncate max-w-[200px]">{task.project.name}</span>
          </div>

          <div className="flex items-center gap-3">
            {task.project.members.some((m: any) => m.userId === user?.id && m.role !== 'VIEWER') && (
              <button 
                onClick={handleDeleteTask}
                className="p-1.5 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 rounded-lg transition-all"
                title="Delete Task"
              >
                <Trash2 size={14} />
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 select-text">
          {/* Task Title */}
          <div>
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-zinc-950 border border-zinc-850 text-base font-bold text-zinc-50 px-2 py-1 rounded w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <Button size="sm" variant="primary" className="h-8" onClick={handleSaveTitle}>
                  <Save size={13} />
                </Button>
              </div>
            ) : (
              <h2 
                onClick={() => setIsEditingTitle(true)}
                className="text-base font-bold text-zinc-50 cursor-pointer hover:text-zinc-200 hover:bg-zinc-850/30 px-1 py-0.5 rounded transition-all leading-snug"
              >
                {task.title}
              </h2>
            )}
          </div>

          {/* Grid Layout: Left column content, Right column metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left side details */}
            <div className="md:col-span-2 flex flex-col gap-6">
              
              {/* Description */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase tracking-wider select-none">
                  <span>Description</span>
                  <button 
                    onClick={handleAIGenerateDescription}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold transition-all lowercase"
                  >
                    <Sparkles size={11} /> generate
                  </button>
                </div>

                {isEditingDesc ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={desc}
                      onChange={(e) => setDesc(e.target.value)}
                      placeholder="Add a detailed description..."
                      rows={5}
                      className="w-full bg-zinc-950 border border-zinc-850 text-xs text-zinc-250 p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setIsEditingDesc(false)}>Cancel</Button>
                      <Button size="sm" variant="primary" onClick={handleSaveDesc}>Save</Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => setIsEditingDesc(true)}
                    className="text-xs text-zinc-400 leading-relaxed p-3 bg-zinc-950/45 rounded-lg border border-zinc-850 cursor-pointer hover:border-zinc-700/50 min-h-[80px]"
                  >
                    {task.description ? (
                      <div className="whitespace-pre-wrap">{task.description}</div>
                    ) : (
                      <span className="text-zinc-600 italic select-none">No description. Click to add one.</span>
                    )}
                  </div>
                )}
              </div>

              {/* Checklist */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase tracking-wider select-none">
                  <span>Checklist ({task.checklists?.filter((c: any) => c.isCompleted).length || 0}/{task.checklists?.length || 0})</span>
                  <button 
                    onClick={handleAISuggestSubtasks}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold transition-all lowercase"
                  >
                    <Sparkles size={11} /> suggest subtasks
                  </button>
                </div>

                {/* Checklist list */}
                <div className="flex flex-col gap-2">
                  {task.checklists?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between group bg-zinc-950/20 border border-zinc-850 px-3 py-2 rounded-lg hover:border-zinc-800 transition-all">
                      <label className="flex items-center gap-3 cursor-pointer text-xs select-none">
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={(e) => handleToggleCheckItem(item.id, e.target.checked)}
                          className="rounded border-zinc-800 bg-zinc-900 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span className={`text-zinc-300 transition-all ${item.isCompleted ? 'line-through text-zinc-600' : ''}`}>
                          {item.title}
                        </span>
                      </label>
                      <button 
                        onClick={() => handleDeleteCheckItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-550 hover:text-rose-400 rounded transition-all"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}

                  <form onSubmit={handleAddCheckItem} className="flex items-center gap-2 mt-1">
                    <Input
                      type="text"
                      placeholder="Add checklist item..."
                      value={newCheckItem}
                      onChange={(e) => setNewCheckItem(e.target.value)}
                      className="py-1.5 h-8 text-xs bg-zinc-950/40"
                    />
                    <Button type="submit" size="sm" variant="glass" className="h-8">
                      <Plus size={13} />
                    </Button>
                  </form>
                </div>
              </div>

              {/* Attachments */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-500 uppercase tracking-wider select-none">
                  <span>Attachments ({task.attachments?.length || 0})</span>
                  <div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleUploadFile} 
                      className="hidden" 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold transition-all"
                    >
                      <Paperclip size={11} /> Add file
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {task.attachments?.map((file: any) => (
                    <div key={file.id} className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-850 bg-zinc-950/20 group hover:border-zinc-800 transition-all">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText size={14} className="text-zinc-550 shrink-0" />
                        <div className="min-w-0 text-[10px]">
                          <p className="font-semibold text-zinc-350 truncate">{file.name}</p>
                          <p className="text-zinc-550 mt-0.5">{Math.round(file.size / 1024)} KB</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                        <a href={file.url} target="_blank" rel="noreferrer" className="p-0.5 text-zinc-500 hover:text-zinc-300 rounded transition-all">
                          Open
                        </a>
                        <button onClick={() => handleDeleteAttachment(file.id)} className="p-0.5 text-zinc-500 hover:text-rose-400 rounded transition-all">
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Threaded Comments */}
              <div className="flex flex-col gap-4 border-t border-zinc-850 pt-5">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider select-none">
                  Comments ({task.comments?.length || 0})
                </span>

                {/* Comment List */}
                <div className="flex flex-col gap-4">
                  {commentThreads.map((c: any) => (
                    <div key={c.id} className="flex flex-col gap-2 text-xs">
                      {/* Comment body */}
                      <div className="flex gap-2.5 items-start">
                        {c.user.avatar ? (
                          <img src={c.user.avatar} className="w-6 h-6 rounded-full object-cover shrink-0 border border-zinc-800" alt="" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-[9px] shrink-0">
                            {c.user.name.slice(0, 2)}
                          </div>
                        )}
                        <div className="flex-1 bg-zinc-950/40 border border-zinc-850 p-3 rounded-xl">
                          <div className="flex items-center justify-between mb-1 text-[10px] text-zinc-500">
                            <span className="font-semibold text-zinc-300">{c.user.name}</span>
                            <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-zinc-400 leading-snug whitespace-pre-wrap">{c.content}</p>
                          
                          {/* Emoji Reactions & Reply button */}
                          <div className="flex items-center gap-3 mt-2 select-none">
                            <button 
                              onClick={() => handleCommentReaction(c.id, '👍')}
                              className="inline-flex items-center gap-1 text-[9px] text-zinc-550 hover:text-indigo-400 bg-zinc-900 border border-zinc-850 hover:border-indigo-500/30 px-1.5 py-0.5 rounded transition-all"
                            >
                              <ThumbsUp size={8.5} />
                              <span>{c.reactions?.filter((r: any) => r.emoji === '👍').length || 0}</span>
                            </button>
                            <button
                              onClick={() => setCommentReplyParentId(c.id)}
                              className="text-[10px] text-zinc-550 hover:text-zinc-350 font-semibold"
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Render replies */}
                      {task.comments.filter((rep: any) => rep.parentId === c.id).map((reply: any) => (
                        <div key={reply.id} className="flex gap-2.5 items-start pl-8">
                          {reply.user.avatar ? (
                            <img src={reply.user.avatar} className="w-5.5 h-5.5 rounded-full object-cover shrink-0 border border-zinc-800" alt="" />
                          ) : (
                            <div className="w-5.5 h-5.5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-[8.5px] shrink-0">
                              {reply.user.name.slice(0, 2)}
                            </div>
                          )}
                          <div className="flex-1 bg-zinc-950/20 border border-zinc-850/80 p-2.5 rounded-xl">
                            <div className="flex items-center justify-between mb-1 text-[10px] text-zinc-550">
                              <span className="font-semibold text-zinc-400">{reply.user.name}</span>
                              <span>{new Date(reply.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-zinc-450 leading-snug whitespace-pre-wrap">{reply.content}</p>
                            
                            <div className="flex items-center gap-3 mt-1.5">
                              <button 
                                onClick={() => handleCommentReaction(reply.id, '👍')}
                                className="inline-flex items-center gap-1 text-[8px] text-zinc-550 hover:text-indigo-400 bg-zinc-900 border border-zinc-850 hover:border-indigo-500/30 px-1 py-0.2 rounded transition-all"
                              >
                                <ThumbsUp size={8} />
                                <span>{reply.reactions?.filter((r: any) => r.emoji === '👍').length || 0}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Comment Input */}
                <form onSubmit={handleAddComment} className="flex flex-col gap-2 border border-zinc-850 p-2 rounded-xl bg-zinc-950/20">
                  {commentReplyParentId && (
                    <div className="px-2 py-1 text-[10px] text-zinc-500 font-bold bg-zinc-900 border border-zinc-850 rounded flex items-center justify-between">
                      <span>Replying to comment...</span>
                      <button onClick={() => setCommentReplyParentId(null)} className="hover:text-zinc-350">
                        <X size={10} />
                      </button>
                    </div>
                  )}
                  <textarea
                    placeholder={commentReplyParentId ? "Write a reply..." : "Write a comment... (use @name to mention)"}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={2}
                    className="w-full bg-transparent border-0 text-xs text-zinc-300 p-2 focus:outline-none focus:ring-0 resize-none"
                  />
                  <div className="flex justify-end pr-2 pb-2">
                    <Button type="submit" size="sm" variant="glass" className="h-7 px-3">
                      <Send size={11} className="mr-1.5" /> Send
                    </Button>
                  </div>
                </form>
              </div>

            </div>

            {/* Right side metadata column */}
            <div className="flex flex-col gap-5 border-l border-zinc-850/60 pl-6 select-none text-xs font-semibold">
              {/* Meta selectors */}
              <div className="flex flex-col gap-4">
                <Select
                  label="Status"
                  value={task.status}
                  onChange={(e) => handleUpdateField({ status: e.target.value })}
                  options={[
                    { value: 'BACKLOG', label: 'Backlog' },
                    { value: 'TODO', label: 'To Do' },
                    { value: 'IN_PROGRESS', label: 'In Progress' },
                    { value: 'REVIEW', label: 'Review' },
                    { value: 'TESTING', label: 'Testing' },
                    { value: 'COMPLETED', label: 'Completed' }
                  ]}
                />

                <Select
                  label="Priority"
                  value={task.priority}
                  onChange={(e) => handleUpdateField({ priority: e.target.value })}
                  options={[
                    { value: 'LOW', label: 'Low' },
                    { value: 'MEDIUM', label: 'Medium' },
                    { value: 'HIGH', label: 'High' },
                    { value: 'CRITICAL', label: 'Critical' }
                  ]}
                />

                <Select
                  label="Assignee"
                  value={task.assigneeId || ''}
                  onChange={(e) => handleUpdateField({ assigneeId: e.target.value || null })}
                  options={[
                    { value: '', label: 'Unassigned' },
                    ...task.project.members.map((m: any) => ({ value: m.userId, label: m.name }))
                  ]}
                />

                <Input
                  label="Due Date"
                  type="date"
                  value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleUpdateField({ dueDate: e.target.value || null })}
                />
              </div>

              {/* AI Tools Panel */}
              <div className="border-t border-zinc-850/80 pt-5 mt-2 flex flex-col gap-3">
                <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-wider">AI Operations Tools</span>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={handleAISuggestPriority}
                    disabled={aiLoading}
                    className="w-full text-left px-3 py-2 rounded-lg border border-indigo-500/10 hover:border-indigo-500/25 bg-indigo-500/[0.02] hover:bg-indigo-500/[0.05] text-indigo-400 font-semibold flex items-center justify-between transition-all"
                  >
                    <span className="flex items-center gap-2"><Sparkles size={11} /> Priority Suggestion</span>
                  </button>
                  <button 
                    onClick={handleAITaskSummary}
                    disabled={aiLoading}
                    className="w-full text-left px-3 py-2 rounded-lg border border-indigo-500/10 hover:border-indigo-500/25 bg-indigo-500/[0.02] hover:bg-indigo-500/[0.05] text-indigo-400 font-semibold flex items-center justify-between transition-all"
                  >
                    <span className="flex items-center gap-2"><Sparkles size={11} /> Generate Summary</span>
                  </button>
                </div>

                {/* AI Reasoning Response Panel */}
                {aiReasoning && (
                  <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg flex gap-2.5 items-start mt-2">
                    <Sparkles size={14} className="text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
                    <p className="text-[10px] text-zinc-350 leading-relaxed font-medium">{aiReasoning}</p>
                  </div>
                )}
                
                {aiLoading && (
                  <div className="text-center py-2 text-[10px] text-indigo-400/80 animate-pulse font-semibold">
                    AI Assistant thinking...
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
