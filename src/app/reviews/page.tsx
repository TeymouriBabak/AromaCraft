"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { normalizeCommentDestination } from "@/lib/review-utils";

type ReviewCard = {
  id: string;
  destination: string;
  title: string;
  rating: number;
  content: string;
  author: string;
  createdAt?: string;
};

const defaultReviews: ReviewCard[] = [
  {
    id: "default-1",
    destination: "home",
    title: "Home",
    rating: 5,
    author: "Amelia",
    content: "A calm, confident experience from discovery to delivery. Everything feels premium and effortless.",
  },
  {
    id: "default-2",
    destination: "pike-place",
    title: "Pike Place",
    rating: 5,
    author: "Noah",
    content: "A luxurious daily ritual with the smoothness and consistency I want in a neighborhood coffee favorite.",
  },
];

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1 text-[#d4a373]">
      {Array.from({ length: rating }).map((_, idx) => (
        <Star key={idx} className="h-4 w-4 fill-current" />
      ))}
    </div>
  );
}

function ReviewList({ items }: { items: ReviewCard[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <div key={item.id} className="rounded-[1.5rem] border border-[#d4a373]/20 bg-white/80 p-4 shadow-sm dark:bg-[#23110c]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#b56e3b]">{normalizeCommentDestination(item.destination) === "pike-place" ? "Pike Place" : "Home"}</p>
              <p className="mt-1 font-semibold text-[#1a0f0a] dark:text-[#f6e5d1]">{item.author}</p>
            </div>
            <StarRow rating={item.rating} />
          </div>
          <p className="text-sm leading-6 text-[#6e4b33] dark:text-[#e8d8c0]">{item.content}</p>
        </div>
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<ReviewCard[]>(defaultReviews);
  const [destination, setDestination] = useState("home");
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    fetch('/api/reviews')
      .then((response) => response.json())
      .then((payload) => {
        if (!active) return;
        const nextReviews = Array.isArray(payload?.data?.reviews) ? payload.data.reviews : defaultReviews;
        setReviews(nextReviews);
      })
      .catch(() => {
        if (active) setReviews(defaultReviews);
      });

    return () => {
      active = false;
    };
  }, []);

  const homeReviews = useMemo(() => reviews.filter((item) => normalizeCommentDestination(item.destination) === "home"), [reviews]);
  const pikePlaceReviews = useMemo(() => reviews.filter((item) => normalizeCommentDestination(item.destination) === "pike-place"), [reviews]);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      setStatus({ type: "error", text: "Please sign in to share your feedback." });
      return;
    }

    if (content.trim().length < 12) {
      setStatus({ type: "error", text: "Please share a few more details about your experience." });
      return;
    }

    setIsSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, rating, content, title: destination }),
      });
      const payload = await response.json();

      if (!response.ok || payload?.ok === false) {
        throw new Error(payload?.error?.message || 'Unable to save your review.');
      }

      const nextReview = payload?.data?.review;
      if (nextReview) {
        setReviews((current) => [nextReview, ...current]);
      }
      setContent("");
      setDestination("home");
      setRating(5);
      setStatus({ type: "success", text: "Thank you for sharing your experience." });
    } catch (error) {
      setStatus({ type: "error", text: error instanceof Error ? error.message : "Unable to save your review." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 rounded-[2rem] border border-[#d4a373]/20 bg-[#f9f6f0] p-8 shadow-sm dark:bg-[#23110c]">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#b56e3b]">Community voices</p>
        <h1 className="mt-4 font-serif text-4xl text-[#1a0f0a] dark:text-[#f6e5d1]">Comments</h1>
      </div>

      <div className="mb-8 rounded-[2rem] border border-[#d4a373]/20 bg-white/80 p-5 shadow-sm dark:bg-[#1a0f0a]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-serif text-2xl text-[#1a0f0a] dark:text-[#f6e5d1]">Leave a note</h2>
          <div className="flex gap-2 rounded-full border border-[#d4a373]/20 bg-[#f9f6f0] p-1 dark:bg-[#23110c]">
            {['home', 'pike-place'].map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDestination(option)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${destination === option ? 'bg-[#1a0f0a] text-white dark:bg-[#f6e5d1] dark:text-[#1a0f0a]' : 'text-[#6e4b33]'}`}
              >
                {option === 'home' ? 'Home' : 'Pike Place'}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          {[1,2,3,4,5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className={`rounded-full border p-2 ${rating >= value ? 'border-[#d4a373] bg-[#f6e5d1] text-[#d4a373]' : 'border-[#d4a373]/20 bg-white text-[#6e4b33]'}`}
              aria-label={`Rate ${value} stars`}
            >
              <Star className={`h-4 w-4 ${rating >= value ? 'fill-current' : ''}`} />
            </button>
          ))}
        </div>

        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={5}
          placeholder={isAuthenticated ? 'Tell us how your experience felt...' : 'Sign in to share your experience...'}
          className="w-full rounded-[1.4rem] border border-[#d4a373]/20 bg-[#f9f6f0] p-4 text-sm outline-none dark:bg-[#23110c]"
          disabled={!isAuthenticated}
        />

        {status ? (
          <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${status.type === 'success' ? 'border-[#2f7d4a]/20 bg-[#f3fbf6] text-[#2f7d4a]' : 'border-[#e76f51]/20 bg-[#fff7f5] text-[#b24c33]'}`}>
            {status.text}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isAuthenticated || isSubmitting}
          className="mt-4 rounded-full bg-[#1a0f0a] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#c7b39a]"
        >
          {isSubmitting ? 'Saving...' : 'Share feedback'}
        </button>
      </div>

      <div className="space-y-8">
        <section className="rounded-[2rem] border border-[#d4a373]/20 bg-white/80 p-5 shadow-sm dark:bg-[#1a0f0a]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-serif text-2xl text-[#1a0f0a] dark:text-[#f6e5d1]">Home experience</h2>
            <span className="rounded-full border border-[#d4a373]/25 bg-[#f9f6f0] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#6e4b33] dark:bg-[#23110c] dark:text-[#e8d8c0]">Global feedback</span>
          </div>
          <ReviewList items={homeReviews.length ? homeReviews : defaultReviews.filter((item) => normalizeCommentDestination(item.destination) === 'home')} />
        </section>

        <section className="rounded-[2rem] border border-[#d4a373]/20 bg-white/80 p-5 shadow-sm dark:bg-[#1a0f0a]">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-serif text-2xl text-[#1a0f0a] dark:text-[#f6e5d1]">Pike Place comments</h2>
            <span className="rounded-full border border-[#d4a373]/25 bg-[#f9f6f0] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[#6e4b33] dark:bg-[#23110c] dark:text-[#e8d8c0]">Favorite destination</span>
          </div>
          <ReviewList items={pikePlaceReviews.length ? pikePlaceReviews : defaultReviews.filter((item) => normalizeCommentDestination(item.destination) === 'pike-place')} />
        </section>
      </div>
    </div>
  );
}
