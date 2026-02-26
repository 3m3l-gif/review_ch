/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  BookOpen, 
  Film, 
  Star, 
  StarHalf, 
  Download, 
  Image as ImageIcon, 
  FileText, 
  Trash2, 
  Plus,
  Quote
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf'; // 중괄호 { } 추가
import { domToPng } from 'modern-screenshot'; // html2canvas 대신 사용

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
  
  // Book specific
  author?: string;
  publisher?: string;
  dateRead?: string;
  quote?: string;
  shortReview?: string;
  extraImage?: string;

  // Movie specific
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
            onContextMenu={(e) => {
              e.preventDefault();
              onChange(star - 0.5);
            }}
            className="text-emerald-500 hover:scale-110 transition-transform"
          >
            {isFull ? (
              <Star className="w-6 h-6 fill-current" />
            ) : isHalf ? (
              <StarHalf className="w-6 h-6 fill-current" />
            ) : (
              <Star className="w-6 h-6 text-gray-300" />
            )}
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
      reader.onloadend = () => {
        onImageSelect(reader.result as string);
      };
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
          <>
            <img src={currentImage} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Plus className="text-white w-8 h-8" />
            </div>
          </>
        ) : (
          <>
            <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-xs text-gray-500">Upload Image</span>
          </>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
      </div>
    </div>
  );
};

export default function App() {
  const [reviewType, setReviewType] = useState<ReviewType>('book');
  const [data, setData] = useState<ReviewData>({
    type: 'book',
    theme: 'green',
    title: '',
    genre: '',
    rating: 0,
    author: '',
    publisher: '',
    dateRead: new Date().toISOString().split('T')[0],
    quote: '',
    shortReview: '',
    director: '',
    plot: '',
    memorablePoints: '',
    impressions: ''
  });

  const themes: { id: ThemeType; name: string; color: string }[] = [
    { id: 'green', name: 'Green', color: 'bg-emerald-500' },
    { id: 'blue', name: 'Blue', color: 'bg-blue-500' },
    { id: 'dark', name: 'Dark', color: 'bg-gray-900' },
    { id: 'minimal', name: 'Minimal', color: 'bg-gray-200' },
  ];

  const previewRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (field: keyof ReviewData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

// 이미지 저장 함수 (기본 화질)
  const exportAsImage = async () => {
  if (!previewRef.current) return;
  try {
    const dataUrl = await domToPng(previewRef.current);
    const link = document.createElement('a');
    link.download = `${data?.title || 'review'}.png`; // data 변수 사용
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error("저장 실패:", err);
  }
};

  // PDF 저장 함수 (중단된 부분 연결 및 괄호 닫기)
  const exportAsPDF = async () => {
    if (!previewRef.current) return;
    try {
      // 1. modern-screenshot으로 고화질 이미지 생성 (oklch 오류 방지)
      const dataUrl = await domToPng(previewRef.current, {
        scale: 2, // PDF 품질을 위해 2배 확대
        backgroundColor: '#ffffff',
      });

      // 2. jsPDF 설정
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // 3. 이미지 삽입 및 저장
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      // data 변수 사용 확인
      pdf.save(`${data?.title || 'review'}-card.pdf`);
    } catch (err) {
      console.error("PDF 저장 실패:", err);
      alert("PDF 생성 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f0] font-sans text-gray-900 selection:bg-emerald-200">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
            <BookOpen className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-serif italic font-bold tracking-tight">Review Card Studio</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={exportAsImage}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
            Save as Image
          </button>
          <button 
            onClick={exportAsPDF}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-medium hover:bg-emerald-700 transition-colors shadow-md"
          >
            <FileText className="w-4 h-4" />
            Save as PDF
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar / Form */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-5 space-y-8"
        >
          {/* Type Selector */}
          <div className="bg-white p-1 rounded-2xl border border-gray-200 flex shadow-sm">
            <button
              onClick={() => {
                setReviewType('book');
                setData(prev => ({ ...prev, type: 'book' }));
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                reviewType === 'book' 
                  ? (data.theme === 'blue' ? 'bg-blue-600 text-white shadow-md' : data.theme === 'dark' ? 'bg-gray-900 text-white shadow-md' : 'bg-emerald-600 text-white shadow-md')
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Book Review
            </button>
            <button
              onClick={() => {
                setReviewType('movie');
                setData(prev => ({ ...prev, type: 'movie' }));
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
                reviewType === 'movie' 
                  ? (data.theme === 'blue' ? 'bg-blue-600 text-white shadow-md' : data.theme === 'dark' ? 'bg-gray-900 text-white shadow-md' : 'bg-emerald-600 text-white shadow-md')
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Film className="w-4 h-4" />
              Movie Review
            </button>
          </div>

          {/* Theme Selector */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Card Theme</label>
            <div className="flex gap-3">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleInputChange('theme', t.id)}
                  className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${
                    data.theme === t.id ? 'border-gray-900 scale-110' : 'border-transparent'
                  }`}
                  title={t.name}
                >
                  <div className={`w-7 h-7 rounded-full ${t.color} shadow-inner`}></div>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={reviewType}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-3xl border border-gray-200 p-8 space-y-6 shadow-sm"
            >
              <div className="grid grid-cols-2 gap-6">
                <ImageUpload 
                  label={reviewType === 'book' ? "Book Cover" : "Movie Poster"} 
                  onImageSelect={(img) => handleInputChange('image', img)}
                  currentImage={data.image}
                />
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Title</label>
                    <input 
                      type="text" 
                      value={data.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter title..."
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Genre</label>
                    <input 
                      type="text" 
                      value={data.genre}
                      onChange={(e) => handleInputChange('genre', e.target.value)}
                      placeholder="e.g. Fiction, Sci-Fi"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  {reviewType === 'book' ? (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Author</label>
                        <input 
                          type="text" 
                          value={data.author}
                          onChange={(e) => handleInputChange('author', e.target.value)}
                          placeholder="Author name"
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Director</label>
                        <input 
                          type="text" 
                          value={data.director}
                          onChange={(e) => handleInputChange('director', e.target.value)}
                          placeholder="Director name"
                          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Rating</label>
                <StarRating rating={data.rating} onChange={(val) => handleInputChange('rating', val)} />
              </div>

              {reviewType === 'book' ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Publisher</label>
                      <input 
                        type="text" 
                        value={data.publisher}
                        onChange={(e) => handleInputChange('publisher', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Date Read</label>
                      <input 
                        type="date" 
                        value={data.dateRead}
                        onChange={(e) => handleInputChange('dateRead', e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Memorable Quote</label>
                    <textarea 
                      value={data.quote}
                      onChange={(e) => handleInputChange('quote', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Short Review</label>
                    <textarea 
                      value={data.shortReview}
                      onChange={(e) => handleInputChange('shortReview', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                    />
                  </div>
                  <ImageUpload 
                    label="Additional Photo (Optional)" 
                    onImageSelect={(img) => handleInputChange('extraImage', img)}
                    currentImage={data.extraImage}
                  />
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Plot Summary</label>
                    <textarea 
                      value={data.plot}
                      onChange={(e) => handleInputChange('plot', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Memorable Points</label>
                    <textarea 
                      value={data.memorablePoints}
                      onChange={(e) => handleInputChange('memorablePoints', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Impressions / Review</label>
                    <textarea 
                      value={data.impressions}
                      onChange={(e) => handleInputChange('impressions', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                    />
                  </div>
                </>
              )}

              <button 
                onClick={() => {
                  setData({
                    type: reviewType,
                    theme: data.theme,
                    title: '',
                    genre: '',
                    rating: 0,
                    author: '',
                    publisher: '',
                    dateRead: new Date().toISOString().split('T')[0],
                    quote: '',
                    shortReview: '',
                    director: '',
                    plot: '',
                    memorablePoints: '',
                    impressions: ''
                  });
                }}
                className="w-full flex items-center justify-center gap-2 py-3 text-gray-500 hover:text-red-500 transition-colors text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Reset Form
              </button>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Preview Area */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 flex flex-col items-center"
        >
          <div className="sticky top-24 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 text-center">A5 Card Preview</h2>
            
            {/* A5 Card Container */}
            <div 
              ref={previewRef}
              className={`shadow-2xl overflow-hidden relative transition-colors duration-500 ${
                data.theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}
              style={{
                width: '148mm',
                height: '210mm',
                minWidth: '148mm',
                minHeight: '210mm',
                backgroundColor: data.theme === 'dark' ? '#1a1a1a' : '#FFFFFF',
                backgroundImage: data.theme === 'minimal' ? 'none' : `radial-gradient(${data.theme === 'dark' ? '#333' : '#e5e7eb'} 0.5px, transparent 0.5px)`,
                backgroundSize: '20px 20px'
              }}
            >
              <div className="p-10 h-full flex flex-col relative z-[1]">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-8">
                  <div className="space-y-1">
                    <div className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
                      data.theme === 'blue' ? 'text-blue-500' : data.theme === 'dark' ? 'text-emerald-400' : data.theme === 'minimal' ? 'text-gray-900' : 'text-emerald-600'
                    }`}>
                      {data.type === 'book' ? 'Library Archive' : 'Cinema Archive'}
                    </div>
                    <h2 className={`text-4xl font-serif font-black leading-tight break-words max-w-[300px] ${
                      data.theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {data.title || 'Untitled'}
                    </h2>
                    <div className={`flex items-center gap-2 text-sm italic font-serif ${
                      data.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <span>{data.type === 'book' ? data.author || 'Author' : data.director || 'Director'}</span>
                      <span className={`w-1 h-1 rounded-full ${data.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}></span>
                      <span>{data.genre || 'Genre'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1 ${
                      data.theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
                    }`}>Rating</div>
                    <div className={`flex items-center gap-0.5 ${
                      data.theme === 'blue' ? 'text-blue-500' : data.theme === 'dark' ? 'text-emerald-400' : 'text-emerald-500'
                    }`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < Math.floor(data.rating) ? 'fill-current' : data.theme === 'dark' ? 'text-gray-800' : 'text-gray-200'}`} 
                        />
                      ))}
                    </div>
                    <div className={`text-xs font-mono mt-1 ${data.theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>{data.rating.toFixed(1)}/5.0</div>
                  </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-12 gap-8 flex-1">
                  {/* Left Column: Image */}
                  <div className="col-span-5 space-y-6">
                    <div className={`aspect-[3/4] w-full rounded-lg shadow-lg overflow-hidden border ${
                      data.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'
                    }`}>
                      {data.image ? (
                        <img src={data.image} alt="Cover" className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${data.theme === 'dark' ? 'text-gray-700' : 'text-gray-300'}`}>
                          {data.type === 'book' ? <BookOpen className="w-12 h-12" /> : <Film className="w-12 h-12" />}
                        </div>
                      )}
                    </div>

                    {data.type === 'book' && (
                      <div className="space-y-4">
                        <div className={`border-t pt-4 ${data.theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
                          <div className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${data.theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>Publisher</div>
                          <div className="text-xs font-medium">{data.publisher || '—'}</div>
                        </div>
                        <div className={`border-t pt-4 ${data.theme === 'dark' ? 'border-gray-800' : 'border-gray-100'}`}>
                          <div className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${data.theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>Date Read</div>
                          <div className="text-xs font-medium">{data.dateRead || '—'}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Details */}
                  <div className="col-span-7 flex flex-col gap-6">
                    {data.type === 'book' ? (
                      <>
                        {data.quote && (
                          <div className={`relative p-6 rounded-2xl border italic font-serif ${
                            data.theme === 'blue' ? 'bg-blue-50/30 border-blue-100 text-blue-900' : 
                            data.theme === 'dark' ? 'bg-gray-800/50 border-gray-700 text-gray-300' : 
                            data.theme === 'minimal' ? 'bg-gray-50 border-gray-200 text-gray-900' :
                            'bg-emerald-50/50 border-emerald-100 text-gray-700'
                          }`}>
                            <Quote className={`absolute -top-3 -left-3 w-8 h-8 fill-current ${
                              data.theme === 'blue' ? 'text-blue-100' : 
                              data.theme === 'dark' ? 'text-gray-700' : 
                              data.theme === 'minimal' ? 'text-gray-200' :
                              'text-emerald-200'
                            }`} />
                            <p className="text-sm leading-relaxed">"{data.quote}"</p>
                          </div>
                        )}
                        
                        <div className="flex-1 space-y-4">
                          <div className={`text-[9px] font-bold uppercase tracking-widest ${data.theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>Review</div>
                          <p className={`text-sm leading-relaxed whitespace-pre-wrap ${data.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {data.shortReview || 'No review written yet...'}
                          </p>
                        </div>

                        {data.extraImage && (
                          <div className={`aspect-video w-full rounded-xl overflow-hidden border shadow-sm ${
                            data.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                          }`}>
                            <img src={data.extraImage} alt="Extra" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <div className={`text-[9px] font-bold uppercase tracking-widest ${data.theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>Plot Summary</div>
                          <p className={`text-xs leading-relaxed ${data.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {data.plot || '—'}
                          </p>
                        </div>
                        
                        <div className="space-y-4">
                          <div className={`text-[9px] font-bold uppercase tracking-widest ${data.theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>Memorable Points</div>
                          <p className={`text-xs leading-relaxed ${data.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {data.memorablePoints || '—'}
                          </p>
                        </div>

                        <div className="flex-1 space-y-4">
                          <div className={`text-[9px] font-bold uppercase tracking-widest ${data.theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>Impressions</div>
                          <p className={`text-sm leading-relaxed whitespace-pre-wrap ${data.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {data.impressions || 'No impressions recorded yet...'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              {data.theme !== 'minimal' && (
                <>
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-50 -z-0 ${
                    data.theme === 'blue' ? 'bg-blue-50' : data.theme === 'dark' ? 'bg-gray-800' : 'bg-emerald-50'
                  }`}></div>
                  <div className={`absolute bottom-0 left-0 w-24 h-24 rounded-tr-full opacity-50 -z-0 ${
                    data.theme === 'blue' ? 'bg-blue-50' : data.theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
                  }`}></div>
                </>
              )}
            </div>
            
            <p className="text-xs text-gray-400 text-center italic">
              * Tip: Right-click stars for half-point ratings
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
} 
