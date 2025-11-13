import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useAppAuth } from '@/hooks/auth'
import { ShoppingList, ShoppingItem, ShoppingListType } from '@/types'
import { getShoppingLists, createShoppingList, deleteShoppingList, getShoppingItems, addShoppingItem, toggleItemPurchased, deleteShoppingItem } from '@/services/api/shoppingListService'

const ShoppingLists = () => {
  const { user } = useAppAuth()
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [activeListId, setActiveListId] = useState<string | null>(null)
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [newListName, setNewListName] = useState('')
  const [newListType, setNewListType] = useState<ShoppingListType>('grocery')
  const [newItemName, setNewItemName] = useState('')
  const [newItemCost, setNewItemCost] = useState<number>(0)
  const [newItemSplit, setNewItemSplit] = useState<ShoppingItem['split']>('50/50')

  useEffect(() => {
    (async () => {
      const l = await getShoppingLists()
      setLists(l)
      if (l.length > 0) {
        setActiveListId(l[0].id)
      }
    })()
  }, [])

  useEffect(() => {
    if (!activeListId) return
    ;(async () => {
      const it = await getShoppingItems(activeListId)
      setItems(it)
    })()
  }, [activeListId])

  const handleCreateList = async () => {
    if (!user) return
    if (!newListName.trim()) return
    const created = await createShoppingList(newListName.trim(), newListType, user.id)
    setLists([created, ...lists])
    setNewListName('')
    setActiveListId(created.id)
  }

  const handleAddItem = async () => {
    if (!activeListId || !newItemName.trim()) return
    const created = await addShoppingItem(activeListId, { name: newItemName.trim(), cost: newItemCost, split: newItemSplit })
    setItems([created, ...items])
    setNewItemName('')
    setNewItemCost(0)
    setNewItemSplit('50/50')
  }

  const total = items.reduce((s, i) => s + i.cost, 0)
  const split50 = total / 2

  return (
    <div className="container py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Shopping Lists</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input placeholder="New list name" value={newListName} onChange={(e)=>setNewListName(e.target.value)} />
            <select className="border rounded px-2" value={newListType} onChange={(e)=>setNewListType(e.target.value as ShoppingListType)}>
              <option value="grocery">Grocery</option>
              <option value="holidays">Holidays</option>
              <option value="car">Car</option>
              <option value="other">Other</option>
            </select>
            <Button onClick={handleCreateList}>Create</Button>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {lists.map(l => (
              <Button key={l.id} variant={activeListId===l.id? 'default':'outline'} onClick={()=>setActiveListId(l.id)}>
                {l.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {activeListId && (
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input placeholder="Item" value={newItemName} onChange={(e)=>setNewItemName(e.target.value)} />
              <Input type="number" placeholder="Cost" value={newItemCost} onChange={(e)=>setNewItemCost(Number(e.target.value))} />
              <select className="border rounded px-2" value={newItemSplit} onChange={(e)=>setNewItemSplit(e.target.value as ShoppingItem['split'])}>
                <option value="50/50">50/50</option>
                <option value="100%">100%</option>
                <option value="custom">Custom</option>
              </select>
              <Button onClick={handleAddItem}>Add</Button>
            </div>
            <div className="space-y-2">
              {items.map(i => (
                <div key={i.id} className="flex items-center justify-between border rounded p-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={i.purchased} onChange={async (e)=>{ await toggleItemPurchased(i.id, e.target.checked); setItems(items.map(x=>x.id===i.id? {...x, purchased: e.target.checked}: x)) }} />
                    <div>
                      <div className="font-medium">{i.name}</div>
                      <div className="text-sm text-gray-500">Split: {i.split}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="font-semibold">£{i.cost.toFixed(2)}</div>
                    <Button variant="outline" size="sm" onClick={async ()=>{ await deleteShoppingItem(i.id); setItems(items.filter(x=>x.id!==i.id)) }}>Remove</Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="p-3 border rounded">Total: £{total.toFixed(2)}</div>
              <div className="p-3 border rounded">Each (50/50): £{split50.toFixed(2)}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ShoppingLists
