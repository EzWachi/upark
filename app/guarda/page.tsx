import { Area } from "@/components/area";

// Guarda: CU-11 a CU-18 se construyen aquí.
export default function Guarda() {
  return (
    <Area titulo="Control de acceso" roles={["guarda"]}>
      {() => <p className="text-neutral-500">Aquí irán la entrada, la salida y la fila del parqueo.</p>}
    </Area>
  );
}
