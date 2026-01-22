import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !key) {
    throw new Error("Missing Supabase credentials")
  }
  
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function POST(request: NextRequest) {
  console.log("[v0] POST /api/products called")
  try {
    const productData = await request.json()
    console.log("[v0] Received product data:", productData)
    
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    console.log("[v0] Supabase URL exists:", !!url)
    console.log("[v0] Service Role Key exists:", !!key)
    
    const supabaseAdmin = getSupabaseAdmin()

    const { data, error } = await supabaseAdmin.from("products").insert([productData]).select().single()

    if (error) {
      console.error("[v0] Supabase error creating product:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log("[v0] Product created successfully:", data)
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Server error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    const { data, error } = await supabaseAdmin.from("products").select("*").order("Categoria", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching products:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
