import { BrandKit } from '@/components/portal/BrandKit'

export default function CompanyPage() {
  return (
    <div className="px-4 sm:px-6 md:px-8 py-6 space-y-8">
      {/* Company overview content */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 md:p-10">
        <BrandKit />
      </div>
    </div>
  )
}
