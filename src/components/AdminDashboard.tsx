import React, { useState } from 'react';
import { DefectCategory, GarmentCategory, GarmentPoint, GarmentType, Style } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, RefreshCcw, ArrowLeft, Plus, Trash2, Save, Layers, Tag, Scissors, Palette, Ruler, CheckCircle2, Factory } from 'lucide-react';
import { fetchApi } from '../lib/api';

interface AdminDashboardProps {
  categories: DefectCategory[];
  garmentCategories: GarmentCategory[];
  onRefreshCategories: () => void;
  onBackToHome: () => void;
}

export function AdminDashboard({ categories, garmentCategories, onRefreshCategories, onBackToHome }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'defects' | 'templates' | 'styles'>('defects');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // States for Garment Templates
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<GarmentCategory>>({
    name: '',
    type: 'tshirt',
    points: []
  });

  // States for Styles
  const [isAddingStyle, setIsAddingStyle] = useState(false);
  const [newStyle, setNewStyle] = useState<Partial<Style>>({
    barcode: '',
    name: '',
    type: 'tshirt',
    categoryId: ''
  });

  const handleSaveTemplate = async () => {
    if (!newTemplate.name) return toast.error('Name is required');
    try {
      const resp = await fetchApi('/api/garment-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTemplate, id: newTemplate.id || `tem-${Date.now()}` })
      });
      if (resp) {
        toast.success('Template saved');
        setIsAddingTemplate(false);
        onRefreshCategories();
      }
    } catch (e) {
      toast.error('Failed to save template');
    }
  };

  const handleSaveStyle = async () => {
    if (!newStyle.barcode || !newStyle.name) return toast.error('Barcode and Name are required');
    
    // Auto-prefill points if a category is selected and current points are empty
    let styleToSave = { ...newStyle };
    if (newStyle.categoryId && (!newStyle.customPoints || newStyle.customPoints.length === 0)) {
      const template = garmentCategories.find(c => c.id === newStyle.categoryId);
      if (template) {
        styleToSave.customPoints = template.points;
        styleToSave.type = template.type;
        styleToSave.frontImageUrl = template.frontImageUrl;
        styleToSave.backImageUrl = template.backImageUrl;
      }
    }

    try {
      const resp = await fetchApi('/api/styles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(styleToSave)
      });
      if (resp) {
        toast.success(`Style ${newStyle.barcode} saved`);
        setIsAddingStyle(false);
        onRefreshCategories();
      }
    } catch (e) {
      toast.error('Failed to save style');
    }
  };

  return (
    <div className="space-y-6">
      <Toaster position="bottom-right" theme="light" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight">Admin Dashboard</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Defect Category Management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onRefreshCategories} className="h-10 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl">
            <RefreshCcw className="w-3.5 h-3.5 mr-2" />
            Refresh
          </Button>
          <Button variant="ghost" onClick={onBackToHome} className="h-10 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl">
            <ArrowLeft className="w-3.5 h-3.5 mr-2" />
            Back
          </Button>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('defects')}
          className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'defects' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Defect Categories
        </button>
        <button 
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'templates' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Garment Templates
        </button>
        <button 
          onClick={() => setActiveTab('styles')}
          className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'styles' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Style Manager
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'defects' && (
          <motion.div
            key="defects"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="border-slate-200 shadow-xl bg-white rounded-3xl overflow-hidden">
              <CardHeader className="p-6 border-b border-slate-50">
                <CardTitle className="text-sm font-black uppercase tracking-widest">Defect Categories ({categories.length})</CardTitle>
                <CardDescription className="text-[10px] font-bold text-slate-400">Manage inspection categories and sub-categories</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {categories.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm font-medium text-slate-400">No categories loaded</p>
                  </div>
                ) : (
                  categories.map((cat) => (
                    <div key={cat.name} className="border border-slate-100 rounded-2xl overflow-hidden">
                      <button
                        onClick={() => setExpandedCategory(expandedCategory === cat.name ? null : cat.name)}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-black text-primary">{cat.icon || cat.name.charAt(0)}</span>
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-black text-slate-900">{cat.name}</p>
                            <p className="text-[10px] font-medium text-slate-400">{cat.subCategories?.length || 0} sub-categories</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-200">
                          {expandedCategory === cat.name ? 'Hide' : 'Show'}
                        </Badge>
                      </button>
                      {expandedCategory === cat.name && (
                        <div className="px-4 pb-4 pt-0 border-t border-slate-50">
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {cat.subCategories?.map((sub) => (
                              <div key={sub.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div>
                                  <p className="text-xs font-bold text-slate-900">{sub.name}</p>
                                  <p className="text-[9px] text-slate-400 font-medium uppercase tracking-widest truncate max-w-[200px]">{sub.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'templates' && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center px-2">
              <h2 className="text-sm font-black uppercase tracking-widest">Garment Templates</h2>
              <Button 
                onClick={() => setIsAddingTemplate(true)}
                className="h-9 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </Button>
            </div>

            {isAddingTemplate && (
              <Card className="border-primary/20 bg-primary/5 rounded-3xl p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Template Name</label>
                      <Input 
                        placeholder="e.g. Round Neck T-Shirt"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                        className="rounded-xl border-slate-200 bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Garment Type</label>
                      <select 
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                        value={newTemplate.type}
                        onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value as GarmentType })}
                      >
                        <option value="tshirt">T-Shirt</option>
                        <option value="shorts">Shorts</option>
                        <option value="combo">Combo</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={() => setIsAddingTemplate(false)} className="rounded-xl text-[10px] font-black uppercase">Cancel</Button>
                    <Button onClick={handleSaveTemplate} className="rounded-xl text-[10px] font-black uppercase"><Save className="w-4 h-4 mr-2" /> Save Template</Button>
                  </div>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {garmentCategories.map(template => (
                <Card key={template.id} className="border-slate-200 shadow-md bg-white rounded-2xl p-4 hover:border-primary/30 transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                      <Scissors className="w-5 h-5" />
                    </div>
                    <Badge variant="secondary" className="text-[8px] font-bold uppercase">{template.type}</Badge>
                  </div>
                  <h3 className="font-black text-slate-900 mb-1">{template.name}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">
                    {template.points.length} Measurement Points
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {template.points.slice(0, 4).map(p => (
                      <Badge key={p.id} variant="outline" className="text-[8px] py-0">{p.label}</Badge>
                    ))}
                    {template.points.length > 4 && <span className="text-[8px] text-slate-400 font-bold">+{template.points.length - 4} more</span>}
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'styles' && (
          <motion.div
            key="styles"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center px-2">
              <h2 className="text-sm font-black uppercase tracking-widest">Style Management</h2>
              <Button 
                onClick={() => setIsAddingStyle(true)}
                className="h-9 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Style
              </Button>
            </div>

            {isAddingStyle && (
              <Card className="border-primary/20 bg-primary/5 rounded-3xl p-6 shadow-2xl">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Barcode / Style Number</label>
                        <div className="relative">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input 
                            placeholder="e.g. SN123456"
                            value={newStyle.barcode}
                            onChange={(e) => setNewStyle({ ...newStyle, barcode: e.target.value })}
                            className="pl-10 rounded-xl border-slate-200 bg-white"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Style Description</label>
                        <Input 
                          placeholder="e.g. Printed Polo Shirt"
                          value={newStyle.name}
                          onChange={(e) => setNewStyle({ ...newStyle, name: e.target.value })}
                          className="rounded-xl border-slate-200 bg-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Base Template (Category)</label>
                        <select 
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                          value={newStyle.categoryId}
                          onChange={(e) => {
                            const cat = garmentCategories.find(c => c.id === e.target.value);
                            setNewStyle({ 
                              ...newStyle, 
                              categoryId: e.target.value,
                              type: cat?.type || newStyle.type
                            });
                          }}
                        >
                          <option value="">-- Select Template --</option>
                          {garmentCategories.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                          ))}
                        </select>
                        <p className="text-[9px] text-primary font-bold italic">Selecting a template will auto-load its points and images.</p>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Garment Type</label>
                        <select 
                          className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                          value={newStyle.type}
                          onChange={(e) => setNewStyle({ ...newStyle, type: e.target.value as GarmentType })}
                          disabled={!!newStyle.categoryId}
                        >
                          <option value="tshirt">T-Shirt</option>
                          <option value="shorts">Shorts</option>
                          <option value="combo">Combo</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-200/50 pt-4 flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => setIsAddingStyle(false)} className="rounded-xl h-11 px-6 text-[10px] font-black uppercase tracking-widest">
                      Cancel
                    </Button>
                    <Button onClick={handleSaveStyle} className="rounded-xl h-11 px-8 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Register Style
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-12 border-dashed border-2 border-slate-200 flex flex-col items-center justify-center text-center bg-slate-50/50 rounded-3xl">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                  <Layers className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="font-black text-slate-400 uppercase tracking-widest text-xs">Style Database</h3>
                <p className="text-[10px] text-slate-300 font-bold max-w-xs mt-2">Existing styles are currently searchable via the scanner interface. We are building the management list.</p>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center pt-8">
        <p className="text-[9px] font-mono text-slate-400">
          SCM QC Admin Panel v2.0.0
        </p>
      </div>
    </div>
  );
}

export default AdminDashboard;
