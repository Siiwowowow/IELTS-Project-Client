"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const StudentResultsSection: React.FC = () => {
  const reviews = [
    {
      quote: "I finally understood how to structure my IELTS writing.",
      author: "Ayesha Rahman",
      role: "Student, Band 8.0",
      band: "8.0",
      image: "/img/student_ayesha.jpg",
      initials: "AR",
    },
    {
      quote: "The practice tests made my preparation much more focused.",
      author: "Tanvir Hasan",
      role: "Student, Band 7.5",
      band: "7.5",
      image: "/img/student_samim.jpg",
      initials: "TH",
    },
    {
      quote: "Vocabulary practice became much easier.",
      author: "Nusrat Jahan",
      role: "Student, Band 8.5",
      band: "8.5",
      image: "/img/student_sadia.jpg",
      initials: "NJ",
    },
  ];

  return (
    <section className="py-16 bg-[#f8f3e9] font-jakarta">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center px-3 py-1 bg-red-50 text-[#FF385C] text-xs font-bold rounded-full w-fit mb-3 border border-red-100/70">
              <span>STUDENT RESULTS</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Real Students. Real Progress.
            </h2>
          </div>

          <Link
            href="/testimonials"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#FF385C] hover:text-[#E0294C] transition-colors"
          >
            <span>View More Stories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 3 Review Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between relative hover:shadow-md transition-shadow"
            >
              <div>
                {/* Student Avatar & Quote */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm bg-slate-100">
                    <Image
                      src={rev.image}
                      alt={rev.author}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed italic">
                      &ldquo;{rev.quote}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Author Details */}
                <div className="pt-2">
                  <div className="text-xs font-bold text-slate-900">
                    — {rev.author}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {rev.role}
                  </div>
                </div>
              </div>

              {/* Red Band Badge on bottom right */}
              <div className="absolute bottom-5 right-5">
                <span className="inline-flex items-center justify-center px-2 py-0.5 bg-[#FF385C] text-white text-xs font-black rounded-md shadow-xs">
                  {rev.band}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
