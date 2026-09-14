import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth/auth";
import { createAttachment, validateAttachmentUpload } from "@/lib/item/item-attachments";
import { prisma } from "@/lib/prisma";
import { buildAttachmentStorageKey, uploadAttachmentObject } from "@/lib/storage/object-storage";

type RouteParams = { workspaceId: string; listId: string; itemId: string };

function itemPath({ workspaceId, listId, itemId }: RouteParams): string {
  return `/workspaces/${workspaceId}/lists/${listId}/items/${itemId}`;
}

function redirectToItem(request: Request, params: RouteParams, attachmentError?: string): NextResponse {
  const target = new URL(itemPath(params), request.url);
  if (attachmentError) {
    target.searchParams.set("attachmentError", attachmentError);
  }
  return NextResponse.redirect(target, { status: 303 });
}

// The upload transport for Attachments (#39): receives the file bytes,
// validates the type allowlist and 1GB cap, uploads to S3-compatible
// storage (ADR 0002), then hands the resulting storageKey to lib/item/ for
// the metadata write and its own authorization check.
export async function POST(request: Request, { params }: { params: Promise<RouteParams> }) {
  const routeParams = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user.emailVerified) {
    return new NextResponse(null, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return redirectToItem(request, routeParams, "missing-file");
  }

  const validation = validateAttachmentUpload({ contentType: file.type, sizeBytes: file.size });
  if (validation.status !== "ok") {
    return redirectToItem(request, routeParams, validation.status);
  }

  const storageKey = buildAttachmentStorageKey(routeParams.itemId, file.name);
  await uploadAttachmentObject({
    storageKey,
    body: Buffer.from(await file.arrayBuffer()),
    contentType: file.type,
  });

  const result = await createAttachment(prisma, {
    actorUserId: session.user.id,
    itemId: routeParams.itemId,
    fileName: file.name,
    contentType: file.type,
    sizeBytes: file.size,
    storageKey,
  });

  if (result.status !== "created") {
    return redirectToItem(request, routeParams, result.status);
  }

  return redirectToItem(request, routeParams);
}
