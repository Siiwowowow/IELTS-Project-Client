"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Calendar, Clock, ArrowRight, BookOpen, User, Sparkles } from "lucide-react";
import { Footer } from "@/components/shared/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CATEGORIES = ["All", "Reading", "Listening", "Writing", "Speaking", "Grammar & Vocab"];

const BLOG_POSTS = [
  {
    id: 1,
    title: "Mastering IELTS Writing Task 2: 5 Essential Rules for a Band 8+",
    slug: "mastering-ielts-writing-task-2",
    description: "Learn how to structure your essay, make cohesive arguments, and use formal vocabulary to secure a top band score in Task 2 writing.",
    category: "Writing",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=600&auto=format&fit=crop",
    author: "Dr. Sarah Jenkins",
    date: "Jun 28, 2026",
    readTime: "7 min read",
    featured: true,
  },
  {
    id: 2,
    title: "How to Avoid the 5 Common Distractors in IELTS Listening",
    slug: "avoid-distractors-ielts-listening",
    description: "Don't fall for synonyms, self-corrections, or fast speaking. Discover practical tips to keep your focus and nail the listening test.",
    category: "Listening",
    image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?q=80&w=400&auto=format&fit=crop",
    author: "Mark Henderson",
    date: "Jun 24, 2026",
    readTime: "5 min read",
    featured: false,
  },
  {
    id: 3,
    title: "Speaking Part 2: Structure Your Cue Card Like a Narrative",
    slug: "speaking-part-2-cue-card-narrative",
    description: "Speaking for 2 minutes can be hard. Learn the 'Story Arc' method to speak fluently and logically without running out of ideas.",
    category: "Speaking",
    image: "https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=400&auto=format&fit=crop",
    author: "Elena Rostova",
    date: "Jun 20, 2026",
    readTime: "6 min read",
    featured: false,
  },
  {
    id: 4,
    title: "Understanding True, False, Not Given Questions in Academic Reading",
    slug: "true-false-not-given-academic-reading",
    description: "This is the most challenging reading question type. Master the logic behind identifying hidden facts and avoiding incorrect assumptions.",
    category: "Reading",
    image: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?q=80&w=400&auto=format&fit=crop",
    author: "James Patterson",
    date: "Jun 15, 2026",
    readTime: "8 min read",
    featured: false,
  },
  {
    id: 5,
    title: "Top 50 Collocations for Academic IELTS Writing & Speaking",
    slug: "top-50-collocations-academic-ielts",
    description: "Using natural word pairings is crucial for lexical resource. Explore 50 high-scoring collocations with exam context examples.",
    category: "Grammar & Vocab",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=400&auto=format&fit=crop",
    author: "Dr. Sarah Jenkins",
    date: "Jun 10, 2026",
    readTime: "9 min read",
    featured: false,
  },
  {
    id: 6,
    title: "Computer-Based vs. Paper-Based IELTS: Which is Best for You?",
    slug: "computer-based-vs-paper-based-ielts",
    description: "A detailed breakdown of screen layouts, typing speed, editing controls, and highlighting features to help you choose the right exam medium.",
    category: "General",
    image: "https://images.unsplash.com/photo-1588702547919-26089e690ecc?q=80&w=400&auto=format&fit=crop",
    author: "Alex Mercer",
    date: "Jun 02, 2026",
    readTime: "6 min read",
    featured: false,
  },
];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchesCategory =
      activeCategory === "All" ||
      post.category.toLowerCase().includes(activeCategory.replace(" & Vocab", "").toLowerCase());
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPost = BLOG_POSTS.find((p) => p.featured);

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50/50">
      {/* Blog Page Hero */}
      <section className="bg-neutral-900 text-white py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-600/10 rounded-full filter blur-3xl pointer-events-none" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative text-center">
          <span className="inline-flex items-center gap-1 bg-red-600/20 text-red-500 rounded-full px-4 py-1 text-xs font-black uppercase tracking-wider mb-4 border border-red-500/20">
            <Sparkles className="size-3" />
            IELTS Preparation Hub
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight">
            The IELTS <span className="text-red-500">Prep</span> Blog
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-neutral-400 text-base sm:text-lg">
            Get the latest test taking strategies, sample essays, listening hacks, and step-by-step guides from certified IELTS examiners.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 flex-1">
        {/* Search & Category Filter Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-neutral-200">
          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                  activeCategory === cat
                    ? "bg-red-600 text-white shadow-md shadow-red-500/15"
                    : "bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-white border-neutral-200 rounded-xl focus-visible:ring-red-500 focus-visible:border-red-500"
            />
          </div>
        </div>

        {/* Featured Post (only show if no search/category filter active, and matches filters) */}
        {activeCategory === "All" && searchQuery === "" && featuredPost && (
          <div className="mt-12">
            <h2 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-6">Featured Article</h2>
            <div className="group relative overflow-hidden rounded-2xl bg-white border border-neutral-100 shadow-md transition-all duration-300 hover:shadow-xl grid md:grid-cols-2">
              <div className="relative h-64 md:h-full min-h-[300px]">
                <img
                  src={featuredPost.image}
                  alt={featuredPost.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
                />
              </div>
              <div className="p-8 sm:p-10 flex flex-col justify-center">
                <span className="inline-block bg-red-50 text-red-600 text-[10px] font-black uppercase px-2.5 py-1 rounded-md mb-4 border border-red-100">
                  {featuredPost.category}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 group-hover:text-red-600 transition-colors leading-tight">
                  <Link href={`/blog/${featuredPost.slug}`}>
                    {featuredPost.title}
                  </Link>
                </h3>
                <p className="mt-4 text-neutral-500 text-sm leading-relaxed">
                  {featuredPost.description}
                </p>
                
                {/* Meta details */}
                <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-semibold text-neutral-400">
                  <div className="flex items-center gap-1">
                    <User className="size-3.5" />
                    <span>{featuredPost.author}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    <span>{featuredPost.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    <span>{featuredPost.readTime}</span>
                  </div>
                </div>

                <div className="mt-8">
                  <Button className="h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md shadow-red-500/10 cursor-pointer" asChild>
                    <Link href={`/blog/${featuredPost.slug}`} className="flex items-center gap-1">
                      Read Full Article
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Regular Posts Grid */}
        <div className="mt-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xs font-black uppercase tracking-wider text-neutral-400">
              {searchQuery || activeCategory !== "All" ? "Search Results" : "Latest Articles"}
            </h2>
            <span className="text-xs font-bold text-neutral-400">
              {filteredPosts.length} {filteredPosts.length === 1 ? "article" : "articles"} found
            </span>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="text-center py-20 bg-white border border-neutral-100 rounded-2xl">
              <BookOpen className="size-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-neutral-800">No articles match your filters</h3>
              <p className="text-sm text-neutral-500 mt-2">Try adjusting your search query or choosing another category.</p>
              <Button
                onClick={() => {
                  setActiveCategory("All");
                  setSearchQuery("");
                }}
                variant="outline"
                className="mt-6 rounded-xl border-neutral-200 font-bold"
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPosts
                // Skip showing the featured post as a grid item if no filters are active
                .filter((post) => !(activeCategory === "All" && searchQuery === "" && post.featured))
                .map((post) => (
                  <article
                    key={post.id}
                    className="group flex flex-col bg-white border border-neutral-100 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="relative h-48 overflow-hidden bg-neutral-100">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-103"
                      />
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-red-50 text-red-600 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-red-100/50">
                          {post.category}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-neutral-900 group-hover:text-red-600 transition-colors leading-snug line-clamp-2">
                        <Link href={`/blog/${post.slug}`}>
                          {post.title}
                        </Link>
                      </h3>
                      <p className="mt-3 text-neutral-500 text-sm line-clamp-3 leading-relaxed flex-1">
                        {post.description}
                      </p>

                      <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between text-[11px] font-semibold text-neutral-400">
                        <span className="truncate max-w-[120px]">{post.author}</span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="flex items-center gap-0.5">
                            <Clock className="size-3" />
                            {post.readTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
            </div>
          )}
        </div>

        {/* Newsletter Call to Action */}
        <section className="mt-20 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-2xl p-8 sm:p-12 relative overflow-hidden shadow-xl shadow-red-500/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full filter blur-2xl pointer-events-none" />
          <div className="relative max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-black">Subscribe to IELTS Insights</h2>
            <p className="mt-3 text-red-100 text-sm sm:text-base leading-relaxed">
              Get the latest mock tests, vocabulary sheets, sample band 9 essays, and structural frameworks delivered to your inbox every Thursday.
            </p>
            <form className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email address"
                required
                className="h-12 bg-white/10 hover:bg-white/15 border-white/20 text-white placeholder:text-red-100 rounded-xl focus-visible:ring-white"
              />
              <Button className="h-12 bg-white hover:bg-neutral-100 text-red-600 font-extrabold text-sm rounded-xl px-6 transition-transform active:scale-98 shadow-sm shrink-0 cursor-pointer">
                Subscribe Now
              </Button>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
