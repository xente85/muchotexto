export class ConexionController {
  private conexion: AbortController | null = null;

  public abort() {
    if (this.conexion) this.conexion.abort();
  }

  public getController() {
    this.conexion = new AbortController();
    return this.conexion;
  }
}
