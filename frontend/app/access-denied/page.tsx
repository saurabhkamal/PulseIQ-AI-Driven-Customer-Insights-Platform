import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Access Denied — PulseIQ",
};

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-[#F3F2EF] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-[#CC3333]/10 mb-6">
          <svg
            className="h-8 w-8 text-[#CC3333]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <h1 className="text-[24px] font-semibold text-[#1A1A1A] mb-2">
          Access Denied
        </h1>
        <p className="text-[14px] text-[#8A8A8A] mb-8">
          You don&apos;t have permission to view this page. Contact your
          administrator if you believe this is a mistake.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center h-10 px-4 rounded-[6px] bg-[#0A66C2] text-white text-[14px] font-medium hover:bg-[#004182] transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
