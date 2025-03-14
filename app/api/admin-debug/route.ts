import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    admin_password_set: !!process.env.ADMIN_PASSWORD,
    public_admin_key_set: !!process.env.NEXT_PUBLIC_ADMIN_KEY,
    // Add a sample value with asterisks to check length without exposing actual value
    admin_password_sample: process.env.ADMIN_PASSWORD 
      ? '*'.repeat(process.env.ADMIN_PASSWORD.length) 
      : null,
    public_admin_key_sample: process.env.NEXT_PUBLIC_ADMIN_KEY 
      ? '*'.repeat(process.env.NEXT_PUBLIC_ADMIN_KEY.length) 
      : null,
  });
} 