import { getPocketBase } from '@/integrations/pocketbase/client'
import { ShoppingList, ShoppingItem, ShoppingListType } from '@/types'

export async function getShoppingLists(): Promise<ShoppingList[]> {
  const pb = await getPocketBase()
  const records = await pb.collection('shopping_lists').getFullList({
    sort: '-created',
    fields: 'id,name,type,createdBy,created'
  })
  return records.map((r: any) => ({
    id: r.id,
    name: r.name,
    type: (r.type || 'other') as ShoppingListType,
    createdBy: r.createdBy,
    createdAt: r.created
  }))
}

export async function createShoppingList(name: string, type: ShoppingListType, createdBy: string): Promise<ShoppingList> {
  const pb = await getPocketBase()
  const r: any = await pb.collection('shopping_lists').create({ name, type, createdBy })
  return { id: r.id, name: r.name, type: (r.type || 'other') as ShoppingListType, createdBy: r.createdBy, createdAt: r.created }
}

export async function deleteShoppingList(id: string): Promise<void> {
  const pb = await getPocketBase()
  await pb.collection('shopping_lists').delete(id)
}

export async function getShoppingItems(listId: string): Promise<ShoppingItem[]> {
  const pb = await getPocketBase()
  const records = await pb.collection('shopping_items').getFullList({
    filter: `listId = "${listId}"`,
    sort: '-created',
    fields: 'id,listId,name,cost,split,purchased,notes'
  })
  return records.map((r: any) => ({
    id: r.id,
    listId: r.listId,
    name: r.name,
    cost: r.cost || 0,
    split: (r.split || '50/50') as ShoppingItem['split'],
    purchased: !!r.purchased,
    notes: r.notes
  }))
}

export async function addShoppingItem(listId: string, item: Omit<ShoppingItem, 'id' | 'listId' | 'purchased'> & { purchased?: boolean }): Promise<ShoppingItem> {
  const pb = await getPocketBase()
  const r: any = await pb.collection('shopping_items').create({
    listId,
    name: item.name,
    cost: item.cost,
    split: item.split,
    purchased: item.purchased ?? false,
    notes: item.notes
  })
  return { id: r.id, listId: r.listId, name: r.name, cost: r.cost || 0, split: (r.split || '50/50') as ShoppingItem['split'], purchased: !!r.purchased, notes: r.notes }
}

export async function toggleItemPurchased(id: string, purchased: boolean): Promise<void> {
  const pb = await getPocketBase()
  await pb.collection('shopping_items').update(id, { purchased })
}

export async function deleteShoppingItem(id: string): Promise<void> {
  const pb = await getPocketBase()
  await pb.collection('shopping_items').delete(id)
}
