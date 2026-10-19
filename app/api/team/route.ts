import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export interface TeamMember {
  id: string;
  name: string;
  phone: string;
  role: 'owner' | 'manager' | 'senior_mechanic' | 'technician' | 'auditor';
  pin: string;
  isActive: boolean;
  createdAt: string;
}

const DEFAULT_MOTOFIT_TEAM: TeamMember[] = [
  {
    id: 'team_akshat',
    name: 'Akshat Mohanty',
    phone: '7259625881',
    role: 'manager',
    pin: '1234',
    isActive: true,
    createdAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'team_samael',
    name: 'Samael Morningstar',
    phone: '6359635416',
    role: 'owner',
    pin: '1234',
    isActive: true,
    createdAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'team_munna',
    name: 'Munna Hezbollah',
    phone: '9123293450',
    role: 'senior_mechanic',
    pin: '1234',
    isActive: true,
    createdAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'team_kunal',
    name: 'Kunal Chota Thakor',
    phone: '6354473666',
    role: 'senior_mechanic',
    pin: '1234',
    isActive: true,
    createdAt: '2026-10-01T10:00:00.000Z',
  },
];

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const queryUserId = url.searchParams.get('userId');
    const auth = await requireAuth(request);
    const userId = auth.user?.userId || queryUserId;

    if (!userId) {
      if (auth.errorResponse) return auth.errorResponse;
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, phone: true },
    });

    const settingKey = `team_${userId}`;
    const setting = await prisma.settings.findUnique({
      where: { key: settingKey },
    });

    let team: TeamMember[] = [];

    if (setting) {
      try {
        team = JSON.parse(setting.value);
      } catch {
        team = [];
      }
    } else {
      // Seed default MotoFit team if MotoFit account
      if (user?.email?.toLowerCase().includes('motofit')) {
        team = DEFAULT_MOTOFIT_TEAM;
      } else {
        team = [
          {
            id: `team_${userId}`,
            name: user?.name || 'Workshop Owner',
            phone: user?.phone || '',
            role: 'owner',
            pin: '1234',
            isActive: true,
            createdAt: new Date().toISOString(),
          },
        ];
      }

      await prisma.settings.create({
        data: {
          key: settingKey,
          value: JSON.stringify(team),
        },
      });
    }

    return NextResponse.json({ team });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const queryUserId = url.searchParams.get('userId');
    const auth = await requireAuth(request);
    const userId = auth.user?.userId || queryUserId;

    if (!userId) {
      if (auth.errorResponse) return auth.errorResponse;
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, role, pin } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    const settingKey = `team_${userId}`;
    const setting = await prisma.settings.findUnique({
      where: { key: settingKey },
    });

    let team: TeamMember[] = [];
    if (setting) {
      try {
        team = JSON.parse(setting.value);
      } catch {
        team = [];
      }
    }

    // Check duplicate phone
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const existingIndex = team.findIndex((m) => m.phone.replace(/[^0-9]/g, '') === cleanPhone);

    const newMember: TeamMember = {
      id: existingIndex >= 0 ? team[existingIndex].id : `team_${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      role: role || 'senior_mechanic',
      pin: pin ? pin.trim() : '1234',
      isActive: true,
      createdAt: existingIndex >= 0 ? team[existingIndex].createdAt : new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      team[existingIndex] = newMember;
    } else {
      team.push(newMember);
    }

    await prisma.settings.upsert({
      where: { key: settingKey },
      create: { key: settingKey, value: JSON.stringify(team) },
      update: { value: JSON.stringify(team) },
    });

    return NextResponse.json({ message: 'Team member saved successfully', teamMember: newMember, team });
  } catch (error) {
    console.error('Error saving team member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const queryUserId = url.searchParams.get('userId');
    const id = url.searchParams.get('id');
    const auth = await requireAuth(request);
    const userId = auth.user?.userId || queryUserId;

    if (!userId) {
      if (auth.errorResponse) return auth.errorResponse;
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
    }

    const settingKey = `team_${userId}`;
    const setting = await prisma.settings.findUnique({
      where: { key: settingKey },
    });

    if (!setting) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    let team: TeamMember[] = JSON.parse(setting.value);
    team = team.filter((m) => m.id !== id);

    await prisma.settings.update({
      where: { key: settingKey },
      data: { value: JSON.stringify(team) },
    });

    return NextResponse.json({ message: 'Team member removed', team });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
