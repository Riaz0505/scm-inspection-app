import React, { useState } from 'react';
import { DefectCategory } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Toaster } from '@/components/ui/sonner';
import { motion } from 'motion/react';
import { LayoutDashboard, RefreshCcw, ArrowLeft } from 'lucide-react';

interface AdminDashboardProps {
  categories: DefectCategory[];
  onRefreshCategories: () => void;
  onBackToHome: () => void;
}

export function AdminDashboard({ categories, onRefreshCategories, onBackToHome }: AdminDashboardProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

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

      <div className="text-center">
        <p className="text-[9px] font-mono text-slate-400">
          SCM QC Admin Panel v2.0.0
        </p>
      </div>
    </div>
  );
}

export default AdminDashboard;
