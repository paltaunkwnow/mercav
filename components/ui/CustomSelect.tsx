"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function CustomSelect({ options, value, onChange, placeholder = "Seleccionar", label, className = "" }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {label && <label className="mb-3 block text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] ml-2">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex w-full items-center justify-between rounded-2xl bg-black/60 px-6 h-16 text-white transition-all duration-300 focus:outline-none border-none ${
            isOpen ? "bg-black/80 shadow-[0_0_30px_rgba(255,215,0,0.05)]" : ""
          }`}
        >
          <span className={`text-sm ${selectedOption ? "text-white font-bold" : "text-gray-500"}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <div className={`transition-transform duration-500 ${isOpen ? "rotate-180" : ""}`}>
             <ChevronDown className={`h-4 w-4 ${isOpen ? "text-gold" : "text-gray-600"}`} />
          </div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 8, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-0 right-0 z-[500] overflow-hidden rounded-[2rem] border border-white/10 bg-[#1A1A1A] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-3xl mt-2"
            >
              <div className="max-h-64 overflow-y-auto scrollbar-hide py-1">
                {options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left text-sm transition-all duration-200 group/item ${
                      value === option.value ? "bg-gold text-black font-bold" : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="flex-1">{option.label}</span>
                    {value === option.value ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-gold/0 group-hover/item:bg-gold transition-all" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
