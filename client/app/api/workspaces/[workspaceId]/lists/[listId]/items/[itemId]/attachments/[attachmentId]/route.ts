import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { getAttachmentForDownload } from "@/lib/item/item-attachments";
import { prisma } from "@/lib/prisma";
import { getAttachmentDownloadUrl } from "@/lib/storage/object-storage";

type RouteParams = { attachmentId: string };

// Issues a time-limited redirect to the Attachment's private storage
// object (ADR 0002) after checking the caller has read access to the
// owning Item — the same threshold that gates the Item detail page.
export async function GET(request: Request, { params }: { params: Promise<RouteParams> }) {
  const { attachmentId } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user.emailVerified) {
    return new NextResponse(null, { status: 401 });
  }

  const result = await getAttachmentForDownload(prisma, { actorUserId: session.user.id, attachmentId });
  if (result.status === "not-found") {
    return new NextResponse(null, { status: 404 });
  }
  if (result.status === "forbidden") {
    return new NextResponse(null, { status: 403 });
  }

  const downloadUrl = await getAttachmentDownloadUrl(result.storageKey);
  return NextResponse.redirect(downloadUrl, { status: 302 });
}
