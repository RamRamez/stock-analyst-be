import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { AxiosResponse, ResponseType } from 'axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

type RawRow = string;

@Injectable()
export class SharesService {
  private readonly logger = new Logger(SharesService.name);
  private readonly marketWatchUrl =
    process.env.TSETMC_MARKETWATCH_URL ||
    'https://old.tsetmc.com/tsev2/data/MarketWatchInit.aspx?h=0&r=0';

  // in-memory latest cache by insCode
  private latestByInsCode: Map<string, Record<string, any>> = new Map();

  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  findAll(): Record<string, any>[] {
    return Array.from(this.latestByInsCode.values());
  }

  findOne(insCode: string): Record<string, any> | null {
    return this.latestByInsCode.get(insCode) ?? null;
  }

  // Run every 10 seconds
  @Cron(CronExpression.EVERY_10_SECONDS)
  async refreshMarketWatch(): Promise<void> {
    try {
      const response = await firstValueFrom<AxiosResponse<string>>(
        this.http.get<string>(this.marketWatchUrl, {
          responseType: 'text' as ResponseType,
        }),
      );
      const text: string = response.data;
      if (!text || typeof text !== 'string') return;

      const rows = text
        .split(';')
        .map((r) => r.trim())
        .filter(Boolean);
      const now = new Date();
      for (const row of rows) {
        const parsed = this.parseRow(row);
        if (!parsed) continue;
        const { insCode, isin, symbol, name, data } = parsed;
        this.latestByInsCode.set(insCode, {
          insCode,
          isin,
          symbol,
          name,
          ...data,
          updatedAt: now.toISOString(),
        });

        // Upsert instrument
        // await this.prisma.instrument.upsert({
        //   where: { insCode },
        //   update: { isin, symbol, name },
        //   create: { insCode, isin, symbol, name },
        // });
      }

      // Persist a minute snapshot per instrument (rounded to minute)
      // const minute = new Date(now);
      // minute.setSeconds(0, 0);
      // const entries = Array.from(this.latestByInsCode.entries());
      // if (entries.length > 0) {
      //   await this.prisma
      //     .$transaction(
      //       entries.map(([insCode, latest]) =>
      //         this.prisma.priceSnapshotMinute.upsert({
      //           where: { insCode_minute: { insCode, minute } },
      //           update: { data: latest },
      //           create: { insCode, minute, data: latest },
      //         }),
      //       ),
      //     )
      //     .catch((err: unknown) => {
      //       const message = err instanceof Error ? err.message : String(err);
      //       this.logger.warn(`Snapshot minute upsert failed: ${message}`);
      //     });
      // }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to refresh market watch: ${message}`);
    }
  }

  // NOTE: Mapping below is based on observed structure of MarketWatchInit output; may need refinement.
  private parseRow(row: RawRow): {
    insCode: string;
    isin?: string;
    symbol?: string;
    name?: string;
    data: Record<string, any>;
  } | null {
    // Rows look like: insCode,ISIN,symbol,nameLine1\nnameLine2, ... numeric fields ...
    // There is a newline between symbol and name; normalize it.
    const normalized = row.replace('\n', ' ');
    const parts = normalized.split(',');
    if (parts.length < 10) return null;
    const insCode = parts[0];
    const isin = parts[1];
    const symbol = parts[2];
    const name = parts[3];

    // Remaining numeric fields are undocumented; we expose as indices for now.
    const numeric = parts.slice(4);
    const data: Record<string, any> = { raw: numeric };
    // Heuristics: last trade price, best bid/ask, volume, value often appear in the first 10-15 slots.
    // We'll map a few common indices if present to helpful names.
    const toNum = (v: string | undefined) =>
      v && v !== '' ? Number(v) : undefined;
    data.open = toNum(numeric[1]);
    data.final = toNum(numeric[2]);
    data.close = toNum(numeric[3]); // last trade or close?
    data.last = toNum(numeric[3]);
    data.count = toNum(numeric[4]);
    data.volume = toNum(numeric[5]);
    data.value = toNum(numeric[6]);
    data.low = toNum(numeric[7]);
    data.high = toNum(numeric[8]);
    data.prevClose = toNum(numeric[9]);
    data.baseVolume = toNum(numeric[11]);
    data.allowedHigh = toNum(numeric[15]);
    data.allowedLow = toNum(numeric[16]);
    data.shareCount = toNum(numeric[17]);
    data.nav = toNum(numeric[19]);
    return { insCode, isin, symbol, name, data };
  }
}
