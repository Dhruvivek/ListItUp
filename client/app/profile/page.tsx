import { notFound } from "next/navigation";
import { User as UserIcon } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireAuthenticatedSession } from "@/lib/session/require-authenticated-session";
import { EditProfileForm } from "./EditProfileForm";
import { loadProfilePageData } from "./page-data";

export default async function ProfilePage() {
  const session = await requireAuthenticatedSession("/profile");
  const data = await loadProfilePageData(prisma, session.user.id);

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#080808] px-6 py-12 text-neutral-300">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 flex items-center gap-4">
          <span className="h-px w-14 bg-[#ff6b4a]" />
          <span className="font-mono text-xs uppercase tracking-[0.24em] text-[#ff6b4a]">
            {"// Profile"}
          </span>
        </div>

        <h1 className="text-3xl font-light text-white">{data.name}</h1>

        <div className="mt-8 flex items-center gap-4">
          {data.image ? (
            // A User-supplied avatar URL is an arbitrary external host, not
            // a locally controlled remote pattern next/image can optimize.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.image}
              alt=""
              className="h-16 w-16 rounded-full border border-[#1a1a1a] object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#1a1a1a] bg-[#0d0d0d]">
              <UserIcon
                className="h-7 w-7 text-neutral-600"
                strokeWidth={1.7}
                aria-hidden="true"
              />
            </div>
          )}
          {data.aboutMe ? (
            <p className="max-w-sm text-sm leading-6 text-neutral-400">
              {data.aboutMe}
            </p>
          ) : null}
        </div>

        <section className="mt-10 border-t border-[#1a1a1a] pt-10">
          <h2 className="mb-4 text-lg font-light text-white">
            Edit your profile
          </h2>
          <EditProfileForm
            name={data.name}
            image={data.image}
            aboutMe={data.aboutMe}
          />
        </section>
      </div>
    </main>
  );
}
