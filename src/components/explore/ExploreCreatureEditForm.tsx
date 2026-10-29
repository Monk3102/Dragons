import React from 'react';
import { MonsterRecord, MonsterStatus } from '../../types';

interface ExploreCreatureEditFormProps {
  editForm: Partial<MonsterRecord>;
  onFormChange: (form: Partial<MonsterRecord>) => void;
}

export const ExploreCreatureEditForm: React.FC<ExploreCreatureEditFormProps> = ({
  editForm,
  onFormChange,
}) => {
  return (
    <div className="space-y-4 bg-white/[0.02] border border-[#c5a059]/30 rounded-xl p-5">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <span className="text-xs font-mono text-amber-300">
          EDITING BESTIARY RECORD
        </span>
        <span className="text-[11px] text-slate-400 font-sans">
          Changes are saved locally to DRACO_ANIMI_LOCAL_BESTIARY_v1
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-mono text-slate-400 mb-1">
            Monster Name
          </label>
          <input
            type="text"
            value={editForm.name || ''}
            onChange={(e) =>
              onFormChange({ ...editForm, name: e.target.value })
            }
            className="w-full px-3 py-1.5 bg-black/50 border border-white/15 rounded-lg text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono text-slate-400 mb-1">
            Status
          </label>
          <select
            value={editForm.status || 'Formidable'}
            onChange={(e) =>
              onFormChange({
                ...editForm,
                status: e.target.value as MonsterStatus,
              })
            }
            className="w-full px-3 py-1.5 bg-black/50 border border-white/15 rounded-lg text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
          >
            <option value="Formidable">Formidable</option>
            <option value="Under Inspection">Under Inspection</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Resting">Resting</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-[11px] font-mono text-slate-400 mb-1">
            Working Meaning / Personal Archetype Summary
          </label>
          <input
            type="text"
            value={editForm.subtitle || ''}
            onChange={(e) =>
              onFormChange({ ...editForm, subtitle: e.target.value })
            }
            className="w-full px-3 py-1.5 bg-black/50 border border-white/15 rounded-lg text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-[11px] font-mono text-slate-400 mb-1">
            Manifestation (How this pattern shows up in daily life)
          </label>
          <textarea
            rows={2}
            value={editForm.manifestation || ''}
            onChange={(e) =>
              onFormChange({
                ...editForm,
                manifestation: e.target.value,
              })
            }
            className="w-full px-3 py-1.5 bg-black/50 border border-white/15 rounded-lg text-xs text-slate-100 focus:border-amber-400 focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono text-slate-400 mb-1">
            Deceptive Whisper / Inner Voice
          </label>
          <input
            type="text"
            value={editForm.voice || ''}
            onChange={(e) =>
              onFormChange({ ...editForm, voice: e.target.value })
            }
            className="w-full px-3 py-1.5 bg-black/50 border border-white/15 rounded-lg text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono text-slate-400 mb-1">
            Somatic / Physical Sensation
          </label>
          <input
            type="text"
            value={editForm.somaticFeeling || ''}
            onChange={(e) =>
              onFormChange({
                ...editForm,
                somaticFeeling: e.target.value,
              })
            }
            className="w-full px-3 py-1.5 bg-black/50 border border-white/15 rounded-lg text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-[11px] font-mono text-slate-400 mb-1">
            Reflective Question / Inquiry
          </label>
          <input
            type="text"
            value={editForm.inquiry || ''}
            onChange={(e) =>
              onFormChange({ ...editForm, inquiry: e.target.value })
            }
            className="w-full px-3 py-1.5 bg-black/50 border border-white/15 rounded-lg text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
