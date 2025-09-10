export type ServiceType = 'wash-fold' | 'dry-clean' | 'ironing'

export interface Service {
  id: string
  name: string
  active: boolean
}

export interface LaundryRequest {
  id: string
  name: string
  phone: string
  address: string
  service: ServiceType
  notes?: string
  createdAt: string
}


