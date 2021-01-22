import { SQLite, SQLiteObject } from "@ionic-native/sqlite/ngx";
import { Platform } from "@ionic/angular";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class DatosService {
  public horarioMatrix: any[][] = [];
  private db: SQLiteObject;
  private horasList: any[] = [];
  private cursosList: any[] = [];
  /*
  Este servicio supone que se ha copiado la bbdd
  */
  /*
   *Platform nos dice si el la plataforma a usar esta lista, entre otras cosas.
   */
  /*
  Un objeto SQLite se encarga de gestionar la bbdd
  */
  constructor(private platform: Platform, private sqlite: SQLite) {}
  executeSentence(
    target: any[],
    sqlSentence: string,
    searchParam: any[]
  ) {
    let consultable = true;
    if (!this.db) {
      this.openDB()
        .then(() => {
          console.log(this.db);
        })
        .catch(() => {
          consultable = false;
        });
    }
    if (consultable) {
      this.db
        .executeSql(sqlSentence, searchParam)
        .then((data) => {
          for (let i = 0; data.rows.length; i++) {
            let obj = data.rows.item(i);
            target.push(obj);
          }
        })
        .catch((e) => {
          console.log("fallo al ejecutar sentencia " + JSON.stringify(e));
        });
    }
  }

  getHoras() {
    const sql = "Select descripcion as nombre from horasSemana";
    this.executeSentence(this.horasList, sql, []);
  }

  getCursos(estudios) {
    const sql =
      "SELECT grupo.idGrupo as id, grupo.nombre FROM grupo INNER JOIN estudios ON grupo.idEstudios = estudios.idEstudios  WHERE estudios.nombre LIKE ?";
    this.executeSentence(this.cursosList, sql, [estudios]);
  }

  fixMerged(input, output): Promise<void> {
    return new Promise((resolve, reject) => {
      let id = -1;
      for (let item of input) {
        if (id == item.id) {
          let prev = output.pop();
          prev.nombre = prev.nombre + " / " + item.nombre;
          prev.descripcion = prev.descripcion + " / " + item.descripcion;
          output.push(prev);
        } else {
          output.push(item);
        }
        id = item.id;
      }
      resolve();
    });
  }
  async getHorario(idGrupo){
    const MAX_HOUR = 6;
    const sqlMateriasDia = "SELECT horaClase.idDiaClase AS id, materia.nombre, materia.completo AS descripcion"+
     "FROM materia NATURAL JOIN materiahoraclase NATURAL JOIN horaClase NATURAL JOIN diaClase INNER JOIN grupo"+
     "ON diaClase.idGrupo = grupo.idGrupo INNER JOIN diaSemana ON diaClase.idDiaSemana = diaSemana.idDiaSemana"+
     "WHERE horaClase.idHorasSemana = ? AND grupo.idGrupo = ?";
     this.horarioMatrix.push([{ "nombre": "HORARIO" }, { "nombre": "LUNES" }, { "nombre": "MARTES" }, { "nombre": "MIERCOLES" }, { "nombre": "JUEVES" }, { "nombre": "VIERNES" }]);
     for (let i = 1; i < MAX_HOUR + 1; i++) {
      let tempList = [];
      let sortedTempList = []
      tempList.push(this.horasList[i - 1]);
      await this.executeSentence(tempList, sqlMateriasDia, [i, idGrupo]);
      await this.fixMerged(tempList, sortedTempList);
      this.horarioMatrix.push(sortedTempList);
     }
  }
   openDB() {
     this.platform
      .ready()
      .then( () => {
        //si la plataforma esta preparada voy a abrir la bbdd ya copiada
        this.sqlite
          //si la bbdd no existe la crea y la abre y si existe la abre
          .create(this.getConector())
          .then((db: SQLiteObject) => {
            this.db = db;
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch();
  }

  private getConector() {
    return {
      name: "Horario16e.db",
      location: "default",
      createFromLocation: 1,
    };
  }
}
