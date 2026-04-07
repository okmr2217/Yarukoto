import Link from "next/link";
import Image from "next/image";
import { Keyboard } from "lucide-react";

const SECTIONS = [
  { id: "about", label: "Yarukotoとは" },
  { id: "basics", label: "基本の使い方" },
  { id: "filters", label: "タスクの絞り込み" },
  { id: "categories", label: "カテゴリ設定" },
  { id: "stats", label: "統計" },
  { id: "shortcuts", label: "ショートカットキー" },
] as const;

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-5xl flex items-center justify-between h-12 px-4">
          <Link href="/" className="flex items-center gap-0.5">
            <Image src="/icons/icon-192x192.png" alt="icon" width={24} height={24} />
            <span className="text-base font-medium font-logo">Yarukoto</span>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            アプリへ戻る
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 flex gap-10">
        {/* Sidebar TOC (desktop) */}
        <aside className="hidden md:block w-48 shrink-0">
          <div className="sticky top-20">
            <p className="text-xs font-medium text-muted-foreground mb-3">目次</p>
            <nav className="space-y-1">
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-0.5"
                >
                  {s.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 space-y-12">
          {/* Mobile TOC */}
          <nav className="md:hidden flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                {s.label}
              </a>
            ))}
          </nav>

          {/* 1. Yarukotoとは */}
          <section id="about" className="scroll-mt-20">
            <h2 className="text-base font-semibold mb-3">Yarukotoとは</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              日毎のタスクを管理するWebアプリです。タスクの作成・完了・スキップ・カテゴリ分類・絞り込みができます。
            </p>
          </section>

          {/* 2. 基本の使い方 */}
          <section id="basics" className="scroll-mt-20">
            <h2 className="text-base font-semibold mb-4">基本の使い方</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">タスクの作成</h3>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside leading-relaxed">
                  <li>画面右下の「＋」ボタン、またはキーボードの <Kbd>N</Kbd> キーを押す</li>
                  <li>タイトルを入力する（必須・最大500文字）</li>
                  <li>必要に応じて予定日・カテゴリ・優先度・メモを設定する</li>
                  <li>「追加」ボタンを押す</li>
                </ol>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">タスクの表示</h3>
                <p className="text-sm text-muted-foreground mb-2">タスクは予定日ごとにセクション分けされて表示されます。</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside leading-relaxed">
                  <li>期限切れ — 予定日が過去のタスク</li>
                  <li>今日 — 本日のタスク</li>
                  <li>未予定 — 予定日が設定されていないタスク</li>
                  <li>完了 — 完了済みのタスク</li>
                  <li>やらない — スキップしたタスク</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">タスクの編集</h3>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside leading-relaxed">
                  <li>タスクカードの編集ボタン（鉛筆アイコン）を押す</li>
                  <li>内容を変更する</li>
                  <li>「保存」ボタンを押す</li>
                </ol>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">タスクの完了・スキップ・元に戻す</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside leading-relaxed">
                  <li>完了にする — タスクカードのチェックボタンを押す</li>
                  <li>やらないにする — タスクカードの「…」メニューから「やらない」を選ぶ</li>
                  <li>元に戻す — 完了・スキップ済みタスクのチェックボタンまたは「…」メニューから「元に戻す」を選ぶ</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">タスクの削除</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  タスクカードの「…」メニューから「削除」を選ぶ。削除したタスクは復元できません。
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">タスクの並び替え</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  並び替えが「表示順」の場合、タスクカードをドラッグ＆ドロップして順序を変更できます。
                </p>
              </div>
            </div>
          </section>

          {/* 3. タスクの絞り込み */}
          <section id="filters" className="scroll-mt-20">
            <h2 className="text-base font-semibold mb-4">タスクの絞り込み</h2>
            <p className="text-sm text-muted-foreground mb-4">
              PCでは左サイドバー、スマートフォンでは画面下部の「絞り込み」から設定します。複数のフィルタを同時に使用できます。
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">フィルタの種類</h3>
                <Table
                  headers={["フィルタ", "説明"]}
                  rows={[
                    ["キーワード", "タイトルで絞り込む"],
                    ["ステータス", "すべて / 未完了 / 完了 / やらない"],
                    ["日付", "指定した日付のタスクを表示する"],
                    ["お気に入り", "お気に入り（★）のタスクのみ表示する"],
                    ["カテゴリ", "1つまたは複数のカテゴリで絞り込む（カテゴリなしも選択可）"],
                  ]}
                />
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">並び替えの種類</h3>
                <Table
                  headers={["並び替え", "説明"]}
                  rows={[
                    ["表示順", "ドラッグ＆ドロップで設定した順"],
                    ["作成日時", "作成が新しい順"],
                    ["完了日時", "完了が新しい順"],
                    ["やらない日時", "スキップが新しい順"],
                  ]}
                />
              </div>
            </div>
          </section>

          {/* 4. カテゴリ設定 */}
          <section id="categories" className="scroll-mt-20">
            <h2 className="text-base font-semibold mb-4">カテゴリ設定</h2>
            <p className="text-sm text-muted-foreground mb-4">
              画面左のサイドバーまたはメニューから「カテゴリ」を開きます。
            </p>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">カテゴリの追加</h3>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside leading-relaxed">
                  <li>「カテゴリを追加」ボタンを押す</li>
                  <li>名前（必須・最大100文字）・説明（任意・最大200文字）・カラー（任意）を入力する</li>
                  <li>「追加」ボタンを押す</li>
                </ol>
                <p className="text-sm text-muted-foreground mt-2">
                  カラーは赤・オレンジ・黄・緑・青・紫・グレーから選択できます。
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">カテゴリの編集・並び替え・削除</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside leading-relaxed">
                  <li>編集 — カテゴリ一覧の編集ボタンを押して名前・説明・カラーを変更する</li>
                  <li>並び替え — ドラッグハンドルをドラッグして表示順を変更する</li>
                  <li>削除 — 「…」メニューから「削除」を選ぶ。削除したカテゴリに紐付いていたタスクはカテゴリなし扱いになる</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">カテゴリのアーカイブ</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  使わなくなったカテゴリはアーカイブできます。アーカイブしたカテゴリはカテゴリ一覧に表示されなくなりますが、紐付け済みのタスクには引き続き表示されます。
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside leading-relaxed">
                  <li>アーカイブ — 「…」メニューから「アーカイブ」を選ぶ</li>
                  <li>解除 — 「アーカイブ済み」セクションのカテゴリから「アーカイブを解除」を選ぶ</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">タスクへのカテゴリ紐付け</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  タスクの作成時または編集時に「カテゴリ」フィールドから選択します。
                </p>
              </div>
            </div>
          </section>

          {/* 5. 統計 */}
          <section id="stats" className="scroll-mt-20">
            <h2 className="text-base font-semibold mb-4">統計</h2>
            <p className="text-sm text-muted-foreground mb-4">
              画面下部のナビゲーションから「統計」を開きます。
            </p>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-2">日別タブ</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  月ごとのカレンダーで各日のタスク状況を確認できます。カレンダーの日付を押すと、その日のタスク一覧に移動します。
                </p>
                <Table
                  headers={["項目", "説明"]}
                  rows={[
                    ["作成", "その日に作成されたタスク数"],
                    ["完了", "その日に完了したタスク数"],
                    ["やらない", "その日にスキップしたタスク数"],
                  ]}
                />
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">カテゴリ別タブ</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  カテゴリごとのタスク状況を確認できます。
                </p>
                <Table
                  headers={["項目", "説明"]}
                  rows={[
                    ["計", "タスクの総数"],
                    ["完了", "完了済みタスク数"],
                    ["スキップ", "スキップしたタスク数"],
                    ["期限切れ", "予定日を過ぎた未完了タスク数"],
                    ["達成率", "完了数 ÷ 総数のパーセンテージ"],
                  ]}
                />
              </div>
            </div>
          </section>

          {/* 6. ショートカットキー */}
          <section id="shortcuts" className="scroll-mt-20">
            <h2 className="text-base font-semibold mb-4">ショートカットキー</h2>
            <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1.5">
              <Keyboard className="h-4 w-4 shrink-0" />
              テキスト入力中はショートカットは無効です。
            </p>
            <Table
              headers={["操作", "キー"]}
              rows={[
                ["タスク作成モーダルを開く", "N"],
                ["カテゴリフィルターを切り替える（カテゴリなし）", "0"],
                ["カテゴリフィルターを切り替える（1番目のカテゴリ）", "1"],
                ["カテゴリフィルターを切り替える（2番目のカテゴリ）", "2"],
                ["カテゴリフィルターを切り替える（3〜9番目）", "3 〜 9"],
              ]}
              keyColumn={1}
            />
            <p className="text-sm text-muted-foreground mt-3">
              カテゴリの番号は、カテゴリ一覧の表示順に対応しています。
            </p>
          </section>
        </main>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-mono">
      {children}
    </kbd>
  );
}

function Table({
  headers,
  rows,
  keyColumn,
}: {
  headers: [string, string];
  rows: [string, string][];
  keyColumn?: number;
}) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">{headers[0]}</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">{headers[1]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([col0, col1], i) => (
            <tr key={i} className="border-b border-border last:border-0">
              <td className="px-4 py-2.5 text-muted-foreground">{col0}</td>
              <td className="px-4 py-2.5 text-muted-foreground">
                {keyColumn === 1 ? (
                  <Kbd>{col1}</Kbd>
                ) : (
                  col1
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
