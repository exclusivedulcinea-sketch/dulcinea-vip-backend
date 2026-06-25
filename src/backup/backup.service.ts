import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  // Ejecutar todos los dias a las 13:00 UTC (8 AM Hora Colombia)
  @Cron('0 13 * * *', { name: 'dailyBackup' })
  handleCron() {
    this.logger.log('Iniciando backup programado de la base de datos...');
    this.ejecutarBackup();
  }

  ejecutarBackup() {
    // 1. Obtener URL de base de datos desde entorno
    let databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      this.logger.error('No se encontro DATABASE_URL en el entorno.');
      return;
    }

    // Remover parametros de consulta (ej: ?schema=public) para pg_dump
    if (databaseUrl.includes('?')) {
      databaseUrl = databaseUrl.split('?')[0];
    }

    // 2. Carpeta de backups: usa variable de entorno o directorio temporal del sistema
    const backupsDir = process.env.BACKUP_DIR || path.join(require('os').tmpdir(), 'dulcinea-backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    // 3. Generar nombre de archivo con fecha (YYYY-MM-DD_HH-mm)
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('es-CO', {
      timeZone: 'America/Bogota',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const p: Record<string, string> = {};
    parts.forEach(part => { p[part.type] = part.value; });
    const dateStr = `${p['year']}-${p['month']}-${p['day']}_${p['hour']}-${p['minute']}`;

    const fileName = `backup_${dateStr}.sql`;
    const filePath = path.join(backupsDir, fileName);

    // 4. Comando pg_dump — usa el pg_dump disponible en el PATH del sistema
    const command = `pg_dump --dbname="${databaseUrl}" --file="${filePath}" --format=c`;

    this.logger.log(`Ejecutando backup hacia: ${filePath}`);

    // 5. Ejecutar proceso
    exec(command, (error, _stdout, stderr) => {
      if (error) {
        this.logger.error(`Error al ejecutar pg_dump: ${error.message}`);
        return;
      }
      if (stderr) {
        this.logger.warn(`pg_dump advierte: ${stderr}`);
      }
      this.logger.log(`Backup completado exitosamente: ${fileName}`);
    });
  }
}
