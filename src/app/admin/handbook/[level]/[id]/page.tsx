export default async function HandbookEntryPage({
  params,
}: {
  params: Promise<{ level: string; id: string }>;
}) {
  const { level, id } = await params;
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-foreground mb-2">
        {level} / {id}
      </h1>
      <p className="text-muted-foreground">
        Em construção — Sub-etapa 2 implementa a entry view.
      </p>
    </div>
  );
}
