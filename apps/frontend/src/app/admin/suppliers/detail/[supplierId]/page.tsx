import SupplierDetailClient from "./SupplierDetailClient";
const Page = ({ params }: { params: Promise<{ supplierId: string }> }) => {
    return (
        <SupplierDetailClient params={params}/>
    )
}