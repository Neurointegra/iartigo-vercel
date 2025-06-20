import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function TableExample() {
  const sampleData = [
    { id: 1, parameter: "Precisão", algorithm1: "85.2%", algorithm2: "87.1%", algorithm3: "82.9%" },
    { id: 2, parameter: "Recall", algorithm1: "78.5%", algorithm2: "81.3%", algorithm3: "76.8%" },
    { id: 3, parameter: "F1-Score", algorithm1: "81.7%", algorithm2: "84.1%", algorithm3: "79.7%" },
    { id: 4, parameter: "Tempo (ms)", algorithm1: "245", algorithm2: "312", algorithm3: "198" },
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Tabela 1: Comparação de Performance dos Algoritmos</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Parâmetro</TableHead>
            <TableHead>Algoritmo A</TableHead>
            <TableHead>Algoritmo B</TableHead>
            <TableHead>Algoritmo C</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sampleData.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium">{row.parameter}</TableCell>
              <TableCell>{row.algorithm1}</TableCell>
              <TableCell>{row.algorithm2}</TableCell>
              <TableCell>{row.algorithm3}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
