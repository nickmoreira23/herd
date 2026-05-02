export default async function HandbookLayerPage({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level } = await params;
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-foreground mb-2">{level}</h1>
      <p className="text-muted-foreground">
        Em construção — Sub-etapa 2 implementa a layer overview.
      </p>
    </div>
  );
}
