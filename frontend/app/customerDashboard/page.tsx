// 'use client';

// import React from 'react';

// export default function CustomerDashboardPlaceholder() {
//     return (
//         <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
//             <div className="bg-white p-12 rounded-[32px] shadow-sm border border-gray-100 text-center max-w-md w-full">
//                 <div className="w-16 h-16 bg-[#00FF85]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
//                     <div className="w-8 h-8 bg-[#00FF85] rounded-lg" />
//                 </div>
//                 <h1 className="text-2xl font-bold text-[#1E293B] mb-3">
//                     Customer Dashboard
//                 </h1>
//                 <p className="text-[#64748B] font-medium italic">
//                     (Coming Soon)
//                 </p>
//                 <div className="mt-8 pt-8 border-t border-gray-50 flex justify-center gap-4">
//                     <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
//                         <div className="w-1/3 h-full bg-[#00FF85]/30 rounded-full" />
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }













import { MessageSquare, Star } from "lucide-react";

export default function ExpertsPage() {
  return (
    <div className="min-h-screen bg-[#f7faf8]">
      {/* ================= HEADER ================= */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-xl font-bold">Nitignati</span>

            <input
              type="text"
              placeholder="Search for experts..."
              className="w-72 rounded-md border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex items-center gap-4 text-sm">
            <button>Explore</button>
            <button>About</button>
            <button className="rounded-md bg-gray-100 px-4 py-2">
              Login
            </button>
            <button className="rounded-md bg-green-500 px-4 py-2 text-white">
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="mx-auto max-w-7xl px-6 py-10 grid grid-cols-12 gap-8">
        {/* ================= FILTERS ================= */}
        <aside className="col-span-3 space-y-8">
          <div>
            <h3 className="font-semibold mb-4">Filters</h3>

            <div className="space-y-3 text-sm">
              <p className="font-medium text-gray-500">CATEGORY</p>

              <label className="flex items-center gap-2">
                <input type="checkbox" />
                All Services
              </label>

              <label className="flex items-center gap-2 text-green-600">
                <input type="checkbox" defaultChecked />
                Content Writing
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" />
                Visual Design
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" />
                Market Strategy
              </label>

              <label className="flex items-center gap-2">
                <input type="checkbox" />
                Tech Support
              </label>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-500">
              PRICE RANGE
            </p>
            <input type="range" className="w-full accent-green-500" />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>$0</span>
              <span>$5,000+</span>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-500">
              SERVICE LOCATION
            </p>
            <div className="rounded-md border p-3 text-sm">
              Remote First
            </div>
          </div>

          <button className="w-full rounded-md bg-green-100 py-2 text-sm text-green-700">
            Reset All Filters
          </button>

          <div className="rounded-xl bg-[#132d1f] p-6 text-white">
            <h4 className="mb-2 font-semibold">
              Need help finding the right expert?
            </h4>
            <p className="mb-4 text-sm text-gray-200">
              Speak with a project advisor for a custom match.
            </p>
            <button className="rounded-md bg-green-500 px-4 py-2 text-sm">
              Get Advice →
            </button>
          </div>
        </aside>

        {/* ================= CONTENT ================= */}
        <section className="col-span-9 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">
                Expert Service Providers
              </h1>
              <p className="text-sm text-gray-500">
                142 verified experts available for your project
              </p>
            </div>

            <select className="rounded-md border px-3 py-2 text-sm">
              <option>Highest Rated</option>
              <option>Lowest Price</option>
              <option>Fastest Response</option>
            </select>
          </div>

          {/* ================= CARD ================= */}
          {[1, 2, 3].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border bg-white p-6"
            >
              <div className="flex gap-5">
                <div className="h-16 w-16 rounded-xl bg-gray-200" />

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Arjun Mehta</h3>
                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-700">
                      PRO
                    </span>
                  </div>

                  <p className="text-sm text-green-700">
                    Professional Copywriter & Content Strategist
                  </p>

                  <p className="max-w-xl text-sm text-gray-500">
                    Helping businesses find their unique voice through
                    clear, engaging content. Specialized in websites,
                    brand stories, and marketing copy.
                  </p>

                  <div className="pt-1 flex gap-4 text-xs text-gray-500">
                    <span>MUMBAI, REMOTE</span>
                    <span>EST. $300 – $800 / PROJECT</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">4.9</span>
                  <span className="text-gray-500">(120+)</span>
                </div>

                <button className="flex items-center gap-2 rounded-md bg-green-500 px-4 py-2 text-sm text-white">
                  <MessageSquare className="h-4 w-4" />
                  Discuss Order
                </button>

                <span className="text-xs text-gray-500">
                  Avg. response: 2 hours
                </span>
              </div>
            </div>
          ))}

          {/* ================= PAGINATION ================= */}
          <div className="flex justify-center items-center gap-2 pt-6">
            <button className="rounded-md border px-3 py-2">‹</button>
            <button className="rounded-md bg-green-500 px-3 py-2 text-white">
              1
            </button>
            <button className="rounded-md border px-3 py-2">2</button>
            <button className="rounded-md border px-3 py-2">3</button>
            <span className="px-2">...</span>
            <button className="rounded-md border px-3 py-2">12</button>
            <button className="rounded-md border px-3 py-2">›</button>
          </div>
        </section>
      </main>
    </div>
  );
}
