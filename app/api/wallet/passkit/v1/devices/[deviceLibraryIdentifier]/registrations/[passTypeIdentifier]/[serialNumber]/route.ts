import { z } from 'zod';
import { prisma } from '@/lib/db';
import { authorizePasskitRequest, passkitPassTypeId } from '@/lib/wallet/passkit-request';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Params = {
  params: {
    deviceLibraryIdentifier: string;
    passTypeIdentifier: string;
    serialNumber: string;
  };
};

const bodySchema = z.object({
  pushToken: z.string().min(1),
});

export async function POST(request: Request, { params }: Params) {
  if (params.passTypeIdentifier !== passkitPassTypeId()) {
    return new Response(null, { status: 404 });
  }

  if (!(await authorizePasskitRequest(params.serialNumber, request))) {
    return new Response(null, { status: 401 });
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.serialNumber },
    select: { id: true },
  });
  if (!ticket) {
    return new Response(null, { status: 404 });
  }

  let pushToken: string;
  try {
    pushToken = bodySchema.parse(await request.json()).pushToken;
  } catch {
    return new Response(null, { status: 400 });
  }

  await prisma.walletPassRegistration.upsert({
    where: {
      deviceLibraryIdentifier_passTypeIdentifier_serialNumber: {
        deviceLibraryIdentifier: params.deviceLibraryIdentifier,
        passTypeIdentifier: params.passTypeIdentifier,
        serialNumber: params.serialNumber,
      },
    },
    create: {
      deviceLibraryIdentifier: params.deviceLibraryIdentifier,
      pushToken,
      passTypeIdentifier: params.passTypeIdentifier,
      serialNumber: params.serialNumber,
      ticketId: ticket.id,
    },
    update: { pushToken },
  });

  return new Response(null, { status: 201 });
}

export async function DELETE(request: Request, { params }: Params) {
  if (params.passTypeIdentifier !== passkitPassTypeId()) {
    return new Response(null, { status: 404 });
  }

  if (!(await authorizePasskitRequest(params.serialNumber, request))) {
    return new Response(null, { status: 401 });
  }

  await prisma.walletPassRegistration.deleteMany({
    where: {
      deviceLibraryIdentifier: params.deviceLibraryIdentifier,
      passTypeIdentifier: params.passTypeIdentifier,
      serialNumber: params.serialNumber,
    },
  });

  return new Response(null, { status: 200 });
}
