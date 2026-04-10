export async function GET() {
  const headers = [
    "name",
    "sku",
    "category",
    "subCategory",
    "redemptionType",
    "retailPrice",
    "costOfGoods",
    "weightOz",
    "tags",
  ];

  const exampleRows = [
    "Example Protein,EX-PROT-001,SUPPLEMENT,Protein,Members Store,49.99,8.50,32.00,protein;whey",
    "Example Tee,EX-APP-001,APPAREL,Tee,Members Rate,34.99,6.00,8.00,cotton;unisex",
  ];

  const csv = [headers.join(","), ...exampleRows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="product-import-template.csv"',
    },
  });
}
