import React, { useState, useRef } from 'react';
import { 
  BookOpen, 
  Film, 
  Star, 
  StarHalf, 
  Image as ImageIcon, 
  FileText, 
  Trash2, 
  Plus,
  Quote
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { domToPng } from 'modern-screenshot';

// --- Types ---
type ReviewType = 'book' | 'movie';
type ThemeType = 'green' | 'blue' | 'dark' | 'minimal';

interface ReviewData {
  type: ReviewType;
  theme: ThemeType;
  title: string;
  genre: string;
  rating: number;
  image?: string;
  author?: string;
  publisher?: string;
  dateRead?: string;
  quote?: string;
  shortReview?: string;
  extraImage?: string;
  director?: string;
  plot?: string;
  memorablePoints?: string;
  impressions?: string;
}

// --- Components ---
const StarRating = ({ rating, onChange }: { rating: number, onChange: (val: number) => void }) => {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFull = rating >= star;
        const isHalf = rating >= star - 0.5 && rating < star;
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(rating === star ? star - 0.5 : star)}
            onContextMenu={(e) => { e.preventDefault(); onChange(star - 0.5); }}
            className="text-emerald-500 hover:scale-110 transition-transform"
          >
            {isFull ? <Star className="w-6 h-6 fill-current" /> : isHalf ? <StarHalf className="w-6 h-6 fill-current" /> : <Star className="w-6 h-6 text-gray-300" />}
          </button>
        );
      })}
      <span className="ml-2 text-sm font-medium text-gray-600">{rating.toFixed(1)} / 5.0</span>
    </div>
  );
};

const ImageUpload = ({ label, onImageSelect, currentImage }: { label: string, onImageSelect: (base64: string) => void, currentImage?: string }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onImageSelect(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</label>
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="relative aspect-[3/4] w-full bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors overflow-hidden group"
      >
        {currentImage ? (
          <><img src={currentImage} alt="Preview" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Plus className="text-white w-8 h-8" /></div></>
        ) : (
          <><ImageIcon className="w-8 h-8 text-gray-400 mb-2" /><span className="text-xs text-gray-500">Upload Image</span></>
        )}
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
      </div>
    </div>
  );
};

export default function App() {
  const [quoteSize, setQuoteSize] = useState<'sm' | 'base' | 'lg'>('base');
  const quoteSizeValues = { sm: '12px', base: '14px', lg: '18px' };
  const [reviewType, setReviewType] = useState<ReviewType>('book');
  const [data, setData] = useState<ReviewData>({
    type: 'book', theme: 'green', title: '', genre: '', rating: 0, author: '', publisher: '',
    dateRead: new Date().toISOString().split('T')[0], quote: '', shortReview: '', director: '', plot: '', memorablePoints: '', impressions: ''
  });

  const themes: { id: ThemeType; name: string; color: string }[] = [
    { id: 'green', name: 'Green', color: 'bg-emerald-500' },
    { id: 'blue', name: 'Blue', color: 'bg-blue-500' },
    { id: 'dark', name: 'Dark', color: 'bg-gray-900' },
    { id: 'minimal', name: 'Minimal', color: 'bg-gray-200' },
  ];

  const previewRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (field: keyof ReviewData, value: any) => setData(prev => ({ ...prev, [field]: value }));

  // 저장 로직 (oklch 컬러 오류 방지용 filter 추가)
  const exportAsImage = async () => {
    if (!previewRef.current) return;
    try {
      const dataUrl = await domToPng(previewRef.current, {
        filter: (node) => {
          // 특정 브라우저에서 오류를 일으키는 요소를 제외하거나 처리할 수 있습니다.
          return true;
        }
      });
      const link = document.createElement('a');
      link.download = `${data.title || 'review'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      alert("이미지 저장 중 오류가 발생했습니다. 다른 브라우저를 사용해 보세요.");
    }
  };

  const exportAsPDF = async () => {
    if (!previewRef.current) return;
    try {
      const dataUrl = await domToPng(previewRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${data.title || 'review'}-card.pdf`);
    } catch (err) {
      alert("PDF 생성 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] font-sans text-gray-900 selection:bg-emerald-200">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white"><BookOpen className="w-6 h-6" /></div>
          <h1 className="text-xl font-serif italic font-bold tracking-tight">Review Card Studio</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportAsImage} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"><ImageIcon className="w-4 h-4" />Save as Image</button>
          <button onClick={exportAsPDF} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-medium hover:bg-emerald-700 transition-colors shadow-md"><FileText className="w-4 h-4" />Save as PDF</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-5 space-y-8">
          {/* 타입 선택기 */}
          <div className="bg-white p-1 rounded-2xl border border-gray-200 flex shadow-sm">
            <button onClick={() => { setReviewType('book'); setData(prev => ({ ...prev, type: 'book' })); }} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${reviewType === 'book' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}><BookOpen className="w-4 h-4" />Book Review</button>
            <button onClick={() => { setReviewType('movie'); setData(prev => ({ ...prev, type: 'movie' })); }} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${reviewType === 'movie' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}><Film className="w-4 h-4" />Movie Review</button>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-200 space-y-6 shadow-sm">
            <div className="grid grid-cols-2 gap-6">
              <ImageUpload label={reviewType === 'book' ? "Book Cover" : "Movie Poster"} onImageSelect={(img) => handleInputChange('image', img)} currentImage={data.image} />
              <div className="space-y-4">
                <div className="space-y-1"><label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Title</label><input type="text" value={data.title} onChange={(e) => handleInputChange('title', e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none" /></div>
                <div className="space-y-1"><label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Genre</label><input type="text" value={data.genre} onChange={(e) => handleInputChange('genre', e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none" /></div>
                <div className="space-y-1"><label className="text-xs font-semibold uppercase tracking-wider text-gray-500">{reviewType === 'book' ? 'Author' : 'Director'}</label><input type="text" value={reviewType === 'book' ? data.author : data.director} onChange={(e) => handleInputChange(reviewType === 'book' ? 'author' : 'director', e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none" /></div>
              </div>
            </div>

            <div className="space-y-1"><label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Rating</label><StarRating rating={data.rating} onChange={(val) => handleInputChange('rating', val)} /></div>

            {/* Quote 부분 - 어떤 타입이든 항상 나오게 하려면 이 위치에 배치 */}
            <div className="space-y-1">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Memorable Quote</label>
                <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                  {(['sm', 'base', 'lg'] as const).map((size) => (
                    <button key={size} type="button" onClick={() => setQuoteSize(size)} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${quoteSize === size ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}>{size === 'sm' ? 'S' : size === 'base' ? 'M' : 'L'}</button>
                  ))}
                </div>
              </div>
              <textarea value={data.quote} onChange={(e) => handleInputChange('quote', e.target.value)} rows={2} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none resize-none" />
            </div>

            {reviewType === 'book' ? (
              <div className="space-y-4">
                <div className="space-y-1"><label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Short Review</label><textarea value={data.shortReview} onChange={(e) => handleInputChange('shortReview', e.target.value)} rows={3} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none resize-none" /></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1"><label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Impressions</label><textarea value={data.impressions} onChange={(e) => handleInputChange('impressions', e.target.value)} rows={4} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none resize-none" /></div>
              </div>
            )}
          </div>
        </motion.div>

        {/* 프리뷰 영역 */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-7 flex flex-col items-center">
          <div className="sticky top-24 space-y-4">
            <div ref={previewRef} className={`shadow-2xl overflow-hidden relative ${data.theme === 'dark' ? 'text-white bg-[#1a1a1a]' : 'text-gray-900 bg-white'}`} style={{ width: '148mm', height: '210mm' }}>
              <div className="p-10 h-full flex flex-col relative z-[1]">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">{data.type === 'book' ? 'Library Archive' : 'Cinema Archive'}</div>
                    <h2 className="text-4xl font-serif font-black">{data.title || 'Untitled'}</h2>
                  </div>
                  <div className="flex text-emerald-500">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`w-4 h-4 ${i < Math.floor(data.rating) ? 'fill-current' : 'text-gray-200'}`} />)}</div>
                </div>
                <div className="grid grid-cols-12 gap-8 flex-1">
                  <div className="col-span-5"><div className="aspect-[3/4] rounded-lg overflow-hidden border border-gray-200">{data.image ? <img src={data.image} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300"><ImageIcon /></div>}</div></div>
                  <div className="col-span-7 flex flex-col gap-6">
                    {data.quote && (
                      <div className="relative p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100 italic font-serif">
                        <Quote className="absolute -top-3 -left-3 w-8 h-8 text-emerald-200 fill-current" />
                        <p style={{ fontSize: quoteSizeValues[quoteSize] }} className="leading-relaxed">"{data.quote}"</p>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">{reviewType === 'book' ? data.shortReview : data.impressions}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}