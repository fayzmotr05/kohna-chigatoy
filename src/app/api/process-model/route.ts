import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const itemId = formData.get('itemId') as string | null;

    if (!file || !itemId) {
      return NextResponse.json(
        { error: 'File and itemId are required' },
        { status: 400 },
      );
    }

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum 200MB.' },
        { status: 400 },
      );
    }

    if (!file.name.toLowerCase().endsWith('.usdz')) {
      return NextResponse.json(
        { error: 'Only USDZ files are accepted' },
        { status: 400 },
      );
    }

    const supabase = createServerClient();

    // Set status to processing
    await supabase
      .from('menu_items')
      .update({ model_status: 'processing' })
      .eq('id', itemId);

    try {
      const buffer = Buffer.from(await file.arrayBuffer());

      // Upload original USDZ to storage
      const originalPath = `models/original/${itemId}.usdz`;
      await supabase.storage
        .from('media')
        .upload(originalPath, buffer, {
          contentType: 'model/vnd.usdz+zip',
          upsert: true,
        });

      // Upload optimized USDZ (same as original for now — full pipeline needs gltf-transform CLI)
      const usdzPath = `models/usdz/${itemId}.usdz`;
      await supabase.storage
        .from('media')
        .upload(usdzPath, buffer, {
          contentType: 'model/vnd.usdz+zip',
          upsert: true,
        });

      // Get public URLs
      const { data: usdzData } = supabase.storage
        .from('media')
        .getPublicUrl(usdzPath);

      // Note: Full GLB conversion requires @gltf-transform/functions + sharp
      // which need native binaries. For now, we store the USDZ and mark as ready.
      // GLB conversion can be added as a background job later.

      // Update menu item with URLs
      await supabase
        .from('menu_items')
        .update({
          model_usdz_url: usdzData.publicUrl,
          model_glb_url: null, // Will be set when GLB conversion is implemented
          model_status: 'ready',
        })
        .eq('id', itemId);

      return NextResponse.json({
        success: true,
        usdzUrl: usdzData.publicUrl,
      });
    } catch (processingError) {
      console.error('Model processing error:', processingError);

      // Set status to failed
      await supabase
        .from('menu_items')
        .update({ model_status: 'failed' })
        .eq('id', itemId);

      return NextResponse.json(
        { error: 'Failed to process model' },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
