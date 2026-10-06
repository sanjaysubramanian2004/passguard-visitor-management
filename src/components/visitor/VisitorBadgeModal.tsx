import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { PopulatedVisit } from '../../types/index.ts';
import { X, Printer, Shield, CheckCircle } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge.tsx';
import { formatTime12h, formatTimeRange12h } from '../../utils/formatters.ts';

interface VisitorBadgeModalProps {
  visitor: PopulatedVisit | null;
  isOpen: boolean;
  onClose: () => void;
}

export const VisitorBadgeModal: React.FC<VisitorBadgeModalProps> = ({ visitor, isOpen, onClose }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    if (visitor && visitor.passNumber) {
      // Encode passNumber directly (e.g. VP-2026-0101) so the QR code is crisp, high-contrast, and 100% scannable by phone cameras & turnstile scanners
      QRCode.toDataURL(visitor.passNumber, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.error('Error generating QR code', err));
    }
  }, [visitor]);

  if (!isOpen || !visitor) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[88vh] sm:max-h-[85vh]">
        
        {/* Modal Controls Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200 bg-slate-50 no-print shrink-0">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <Shield className="w-5 h-5 text-teal-700 shrink-0" />
            <span className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
              Official Visitor Pass Badge
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="btn-emerald px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Badge</span>
              <span className="sm:hidden">Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
              aria-label="Close pass preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Badge Card Container (Scrollable with bottom clearance) */}
        <div className="p-3 sm:p-5 pb-8 sm:pb-10 overflow-y-auto bg-slate-100/90 flex-1 min-h-0 flex flex-col items-center justify-start scroll-smooth">
          <div
            id="printable-pass"
            className="w-full max-w-md bg-white border-2 border-slate-300 rounded-2xl shadow-md p-3.5 sm:p-4 flex flex-col my-auto"
          >
            {/* Top Badge Header Bar */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-2.5 mb-2.5">
              <div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded bg-slate-900 flex items-center justify-center text-white font-bold text-[10px]">
                    PG
                  </div>
                  <span className="text-xs sm:text-sm font-black tracking-tight text-slate-900 uppercase">
                    PASSGUARD SECURE
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-slate-500 mt-0.5">VISITOR IDENTIFICATION BADGE</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs sm:text-sm font-black text-slate-900 tracking-wider block">
                  {visitor.passNumber}
                </span>
                <div className="mt-0.5">
                  <StatusBadge status={visitor.status} showIcon={false} />
                </div>
              </div>
            </div>

            {/* Visitor Identity Profile */}
            <div className="flex items-center gap-3 mb-2.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center text-base font-black shrink-0 shadow-inner">
                {visitor.visitorName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                  {visitor.visitorName}
                </h3>
                <p className="text-[11px] font-bold text-teal-800 truncate">
                  {visitor.visitorCompany || 'Independent Visitor'}
                </p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                  ID: {visitor.visitorIdType || 'National ID'} ({visitor.visitorIdNumber || 'N/A'})
                </p>
              </div>
            </div>

            {/* Visit Details Grid */}
            <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 mb-2.5 text-[10px] sm:text-[11px]">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Host Employee</span>
                <span className="font-bold text-slate-800 truncate block">{visitor.employeeName}</span>
                <span className="text-[10px] text-slate-500 truncate block">{visitor.employeeDepartment}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Purpose</span>
                <span className="font-bold text-slate-800 block truncate">{visitor.purpose}</span>
                <span className="text-[10px] text-slate-500 truncate block">{visitor.notes || 'Official Meeting'}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Valid Date</span>
                <span className="font-mono font-bold text-slate-800 block">{visitor.visitDate}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Scheduled Time</span>
                <span className="font-mono font-bold text-slate-800 block truncate">
                  {formatTimeRange12h(visitor.expectedArrivalTime, visitor.expectedDepartureTime)}
                </span>
              </div>
            </div>

            {/* Check-In Timestamp if available */}
            {visitor.checkInTime && (
              <div className="mb-2.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] flex items-center justify-between">
                <span className="text-emerald-800 font-bold flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  <span>Checked In:</span>
                </span>
                <span className="font-mono font-bold text-emerald-950">
                  {formatTime12h(visitor.checkInTime)}
                </span>
              </div>
            )}

            {/* QR Code & Safety Instructions */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-200 mt-1">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt={`Scannable QR code for pass ${visitor.passNumber}`}
                  className="w-20 h-20 sm:w-22 sm:h-22 border border-slate-200 rounded-xl shrink-0 p-1.5 bg-white shadow-2xs image-render-crisp"
                />
              ) : (
                <div className="w-20 h-20 bg-slate-200 rounded-xl animate-pulse shrink-0" />
              )}
              <div className="text-[10px] text-slate-600 leading-snug space-y-0.5 min-w-0">
                <p className="font-bold text-slate-900">Visitor Instructions:</p>
                <p>1. Display badge visibly at all times.</p>
                <p>2. Escort required in restricted areas.</p>
                <p>3. Return pass to Reception upon checkout.</p>
                <p className="text-[9px] font-mono text-teal-800 font-semibold pt-0.5">
                  Pass ID: {visitor.passNumber}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 border-t border-slate-200 bg-white no-print shrink-0">
          <div className="text-[11px] text-slate-500 font-mono truncate mr-2">
            Pass Number: <span className="font-bold text-teal-900">{visitor.passNumber}</span>
          </div>
          <button
            onClick={onClose}
            className="btn-dark px-4 py-1.5 text-xs font-bold rounded-xl cursor-pointer shrink-0"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
