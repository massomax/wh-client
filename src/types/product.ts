export interface Product {
    _id: string
    name: string
    quantity: number
    criticalValue: number
    category: string
    photo?: {
        url: string
        deleteHash: string
    }
    createdAt: string
}