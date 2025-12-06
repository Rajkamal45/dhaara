'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Download, Printer, ArrowLeft, Package, CheckCircle, Phone, Mail, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OrderItem {
  id: string
  name: string
  sku: string
  quantity: number
  price: number
  price_per_quantity: number
  unit: string
  total: number
  image_url?: string
}

interface InvoiceData {
  id: string
  order_number: string
  status: string
  payment_status: string
  payment_method: string
  subtotal: number
  tax_amount: number
  delivery_fee: number
  discount_amount: number
  total_amount: number
  created_at: string
  delivered_at?: string
  delivery_address?: string
  delivery_city?: string
  delivery_state?: string
  delivery_pincode?: string
  delivery_phone?: string
  notes?: string
  user?: {
    full_name?: string
    email?: string
    phone?: string
    business_name?: string
    gstin?: string
    address_line1?: string
    city?: string
    state?: string
    postal_code?: string
  }
  region?: {
    name: string
    code: string
    support_email?: string
    support_phone?: string
  }
  order_items: OrderItem[]
}

export default function InvoicePage() {
  const params = useParams()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [invoice, setInvoice] = useState<InvoiceData | null>(null)

  useEffect(() => {
    fetchInvoice()
  }, [params.id])

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}/invoice`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch invoice')
      }

      const data = await response.json()
      setInvoice(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-green-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Invoice not found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.back()} className="bg-green-600 hover:bg-green-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const invoiceDate = new Date(invoice.created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const deliveryDate = invoice.delivered_at
    ? new Date(invoice.delivered_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden;
          }
          #invoice-print-area, #invoice-print-area * {
            visibility: visible;
          }
          #invoice-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            margin: 15mm;
            size: A4;
          }
        }
      `}</style>

      <div className="min-h-screen bg-gray-100">
        {/* Action Bar */}
        <div className="no-print bg-white border-b sticky top-0 z-10 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Button variant="ghost" onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handlePrint} className="border-gray-300">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button onClick={handlePrint} className="bg-green-600 hover:bg-green-700 shadow-md">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="py-8 px-4">
          <div id="invoice-print-area" className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">

              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-8">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Package className="h-7 w-7" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold">Dhaara</h1>
                        <p className="text-green-100 text-sm">B2B Delivery Platform</p>
                      </div>
                    </div>
                    {invoice.region && (
                      <div className="mt-4 text-green-100 text-sm space-y-1">
                        <p>{invoice.region.name}</p>
                        {invoice.region.support_email && (
                          <p className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {invoice.region.support_email}
                          </p>
                        )}
                        {invoice.region.support_phone && (
                          <p className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            {invoice.region.support_phone}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <h2 className="text-3xl font-bold mb-1">INVOICE</h2>
                    <p className="text-green-100 text-lg">#{invoice.order_number}</p>
                    <div className="mt-4 inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium capitalize">{invoice.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Cards */}
              <div className="p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Invoice Date</p>
                    <p className="font-semibold text-gray-900">{invoiceDate}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Delivery Date</p>
                    <p className="font-semibold text-gray-900">{deliveryDate || 'Pending'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Payment Method</p>
                    <p className="font-semibold text-gray-900">
                      {invoice.payment_method === 'cod' ? 'Cash on Delivery' : invoice.payment_method || 'N/A'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Payment Status</p>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      invoice.payment_status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {invoice.payment_status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Bill To & Ship To */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="h-4 w-4 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Bill To</h3>
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold text-gray-900 text-lg">
                        {invoice.user?.business_name || invoice.user?.full_name || 'Customer'}
                      </p>
                      {invoice.user?.business_name && invoice.user?.full_name && (
                        <p className="text-gray-600">{invoice.user.full_name}</p>
                      )}
                      {invoice.user?.gstin && (
                        <p className="text-sm text-gray-500">
                          <span className="font-medium">GSTIN:</span> {invoice.user.gstin}
                        </p>
                      )}
                      {invoice.user?.email && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          {invoice.user.email}
                        </p>
                      )}
                      {invoice.user?.phone && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          {invoice.user.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">Ship To</h3>
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold text-gray-900 text-lg">
                        {invoice.user?.business_name || invoice.user?.full_name || 'Customer'}
                      </p>
                      <p className="text-gray-600">{invoice.delivery_address || 'N/A'}</p>
                      <p className="text-gray-600">
                        {[invoice.delivery_city, invoice.delivery_state, invoice.delivery_pincode]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                      {invoice.delivery_phone && (
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />
                          {invoice.delivery_phone}
                        </p>
                      )}
                      {deliveryDate && (
                        <div className="mt-3 inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                          <CheckCircle className="h-4 w-4" />
                          Delivered on {deliveryDate}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Items Table */}
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Item</th>
                          <th className="text-center px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU</th>
                          <th className="text-center px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                          <th className="text-right px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
                          <th className="text-right px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(invoice.order_items || []).map((item, index) => (
                          <tr key={item.id || index} className="hover:bg-gray-50/50">
                            <td className="px-5 py-4">
                              <p className="font-medium text-gray-900">{item.name || 'Product'}</p>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                                {item.sku || 'N/A'}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-center text-gray-600">
                              {item.quantity || 1} {item.unit || 'pc'}
                            </td>
                            <td className="px-5 py-4 text-right text-gray-600">
                              Rs. {item.price || 0}
                              {(item.price_per_quantity || 1) > 1 && (
                                <span className="text-gray-400 text-xs">/{item.price_per_quantity}{item.unit}</span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right font-semibold text-gray-900">
                              Rs. {(item.total || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-full max-w-sm">
                    <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>Rs. {(invoice.subtotal || 0).toFixed(2)}</span>
                      </div>
                      {(invoice.tax_amount || 0) > 0 && (
                        <div className="flex justify-between text-gray-600">
                          <span>Tax</span>
                          <span>Rs. {(invoice.tax_amount || 0).toFixed(2)}</span>
                        </div>
                      )}
                      {(invoice.delivery_fee || 0) > 0 && (
                        <div className="flex justify-between text-gray-600">
                          <span>Delivery Fee</span>
                          <span>Rs. {(invoice.delivery_fee || 0).toFixed(2)}</span>
                        </div>
                      )}
                      {(invoice.discount_amount || 0) > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount</span>
                          <span>- Rs. {(invoice.discount_amount || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t-2 border-gray-200 pt-3 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold text-gray-900">Total</span>
                          <span className="text-2xl font-bold text-green-600">
                            Rs. {(invoice.total_amount || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {invoice.notes && (
                  <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-5">
                    <h3 className="font-semibold text-yellow-800 mb-2">Notes</h3>
                    <p className="text-yellow-700 text-sm">{invoice.notes}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 border-t px-8 py-6">
                <div className="text-center">
                  <p className="text-gray-600 font-medium">Thank you for your business!</p>
                  <p className="text-gray-400 text-sm mt-2">
                    This is a computer-generated invoice and does not require a signature.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-400">
                    <span>Dhaara B2B Delivery</span>
                    <span>|</span>
                    <span>Invoice #{invoice.order_number}</span>
                    <span>|</span>
                    <span>{invoiceDate}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  )
}
