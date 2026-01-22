"use server"

import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function createProduct(productData: {
  Categoria: string
  Subcategoria: string
  Item: string
  Proveedor: string
  Costo: number
}) {
  const { data, error } = await supabaseAdmin.from("products").insert([productData]).select().single()

  if (error) {
    console.error("[v0] Error creating product:", error)
    throw new Error(error.message)
  }

  console.log("[v0] Product created successfully:", data)
  return data
}

export async function updateProduct(
  id: number,
  productData: {
    Categoria?: string
    Subcategoria?: string
    Item?: string
    Proveedor?: string
    Costo?: number
  },
) {
  const { data, error } = await supabaseAdmin.from("products").update(productData).eq("id", id).select().single()

  if (error) {
    console.error("[v0] Error updating product:", error)
    throw new Error(error.message)
  }

  console.log("[v0] Product updated successfully:", data)
  return data
}

export async function deleteProduct(id: number) {
  const { error } = await supabaseAdmin.from("products").delete().eq("id", id)

  if (error) {
    console.error("[v0] Error deleting product:", error)
    throw new Error(error.message)
  }

  console.log("[v0] Product deleted successfully")
  return true
}
