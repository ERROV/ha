'use client';
import React, { useState } from 'react';
import useSWR from 'swr';
import { toast } from 'react-hot-toast';
import { MapPin, Plus, ListOrdered } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AdminNeighborhoodCard() {
  const { data, mutate } = useSWR('/api/neighborhoods', fetcher);
  const [district, setDistrict] = useState('');
  const [parent, setParent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!district || !parent) return toast.error('Both fields are required');

    const res = await fetch('/api/neighborhoods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ district, parent }),
    });

    if (res.ok) {
      toast.success('Neighborhood updated successfully!');
      setDistrict('');
      setParent('');
      mutate();
    } else {
      const err = await res.json();
      toast.error(err.error || 'Failed to update neighborhood');
    }
  };

  return (
    <div className="space-y-6">
      {/* Form Section */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-bold text-muted-foreground mb-1.5">
            District Identifier Code
          </label>
          <input
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-border text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            placeholder="e.g. 817"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-muted-foreground mb-1.5">
            Parent Mapping Value
          </label>
          <input
            value={parent}
            onChange={(e) => setParent(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-input border border-border text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            placeholder="e.g. BYA_Mokld_Dis@817"
          />
        </div>

        <Button
          type="submit"
          className="w-full font-bold shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          <span>Save Neighborhood</span>
        </Button>
      </form>

      {/* List Section */}
      <div className="border-t border-border pt-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <ListOrdered className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Current Operational Entries</h3>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
          {data?.length > 0 ? (
            data.map((item: any) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-muted/30 rounded-xl p-3.5 border border-border hover:border-primary/50 transition-all flex flex-col gap-0.5"
              >
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                  <p className="font-bold text-xs text-foreground">{item.district}</p>
                </div>
                <p className="text-[11px] text-muted-foreground pl-5 font-mono">{item.parent}</p>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No registered neighborhood boundaries</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}