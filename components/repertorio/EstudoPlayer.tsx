// src/components/repertorio/EstudoPlayer.tsx
"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type {
  RepertorioResponseDto,
  ItemRepertorioResponseDto,
  FaixaEstudoDto,
} from "@/dtos/repertorio/repertorio-response.dto"

interface Props {
  repertorio: RepertorioResponseDto
  instrumentoDoMembro: string | null
}

// Extrai o FILE_ID de qualquer formato de link do Google Drive
function extrairFileIdDrive(link: string): string | null {
  const match =
    link.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    link.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

// Verifica se é um link do Google Drive
function isDriveLink(link: string): boolean {
  return link.includes("drive.google.com") || link.includes("docs.google.com")
}

// Monta URL de preview do Drive (funciona sem CORS)
function drivePreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`
}

export default function EstudoPlayer({ repertorio, instrumentoDoMembro }: Props) {
  const [itemAtivo, setItemAtivo] = useState<ItemRepertorioResponseDto | null>(
    repertorio.itens[0] ?? null
  )
  const [faixaAtiva, setFaixaAtiva] = useState<FaixaEstudoDto | null>(null)

  // Áudio nativo — só para links não-Drive
  const [velocidade, setVelocidade] = useState(1)
  const [tocando, setTocando] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const [duracao, setDuracao] = useState(0)
  const [erroAudio, setErroAudio] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const isDrive = faixaAtiva ? isDriveLink(faixaAtiva.linkAudio) : false
  const driveFileId = faixaAtiva ? extrairFileIdDrive(faixaAtiva.linkAudio) : null

  const selecionarFaixaParaMembro = useCallback(
    (item: ItemRepertorioResponseDto) => {
      const faixas = item.cantorInfo?.faixas ?? []
      if (faixas.length === 0) { setFaixaAtiva(null); return }
      if (instrumentoDoMembro) {
        const match = faixas.find((f) =>
          f.instrumento.toLowerCase().includes(instrumentoDoMembro.toLowerCase())
        )
        setFaixaAtiva(match ?? faixas[0])
      } else {
        setFaixaAtiva(faixas[0])
      }
    },
    [instrumentoDoMembro]
  )

  const pararAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.removeAttribute("src")
      audioRef.current.load()
    }
    setTocando(false)
    setProgresso(0)
    setDuracao(0)
    setErroAudio(null)
  }, [])

  useEffect(() => {
    if (!itemAtivo) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    pararAudio()
    selecionarFaixaParaMembro(itemAtivo)
  }, [itemAtivo, selecionarFaixaParaMembro, pararAudio])

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = velocidade
  }, [velocidade])

  function handleSelecionarItem(item: ItemRepertorioResponseDto) {
    setItemAtivo(item)
  }

  function handleSelecionarFaixa(faixa: FaixaEstudoDto) {
    pararAudio()
    setFaixaAtiva(faixa)
  }

  async function handlePlayPause() {
    if (!audioRef.current || !faixaAtiva || isDrive) return
    setErroAudio(null)
    if (tocando) {
      audioRef.current.pause()
      setTocando(false)
      return
    }
    if (!audioRef.current.src || audioRef.current.src === window.location.href) {
      audioRef.current.src = faixaAtiva.linkAudio
      audioRef.current.load()
    }
    try {
      await audioRef.current.play()
      audioRef.current.playbackRate = velocidade
      setTocando(true)
    } catch {
      setErroAudio("Não foi possível reproduzir este link diretamente.")
      setTocando(false)
    }
  }

  function handleTimeUpdate() {
    if (audioRef.current) setProgresso(audioRef.current.currentTime)
  }

  function handleLoadedMetadata() {
    if (audioRef.current) {
      setDuracao(audioRef.current.duration)
      audioRef.current.playbackRate = velocidade
    }
  }

  function handleAudioError() {
    setErroAudio("Erro ao carregar o áudio.")
    setTocando(false)
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const t = Number(e.target.value)
    if (audioRef.current) audioRef.current.currentTime = t
    setProgresso(t)
  }

  function formatarTempo(s: number): string {
    if (!isFinite(s) || isNaN(s)) return "0:00"
    const m = Math.floor(s / 60)
    const seg = Math.floor(s % 60)
    return `${m}:${seg.toString().padStart(2, "0")}`
  }

  const VELOCIDADES = [0.5, 0.75, 1, 1.25, 1.5]

  return (
    <div className="space-y-4">

      {/* Lista de músicas */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
            Repertório — {repertorio.cantorNome}
          </p>
        </div>
        <div className="divide-y divide-zinc-100">
          {repertorio.itens.map((item, idx) => {
            const ativo = itemAtivo?.id === item.id
            const faixas = item.cantorInfo?.faixas ?? []
            const temFaixa = instrumentoDoMembro
              ? faixas.some((f) =>
                  f.instrumento.toLowerCase().includes(instrumentoDoMembro.toLowerCase())
                )
              : faixas.length > 0

            return (
              <button
                key={item.id}
                onClick={() => handleSelecionarItem(item)}
                className={`w-full text-left flex items-center gap-3 px-5 py-3 transition-colors ${
                  ativo ? "bg-violet-50 border-l-2 border-violet-500" : "hover:bg-zinc-50"
                }`}
              >
                <span className="text-xs text-zinc-300 w-5 text-right shrink-0">
                  {item.ordem ?? idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-medium truncate ${ativo ? "text-violet-700" : "text-zinc-800"}`}>
                      {item.musicaTitulo}
                    </p>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-mono shrink-0 ${
                      ativo ? "bg-violet-100 text-violet-700" : "bg-zinc-100 text-zinc-500"
                    }`}>
                      {item.tomUsado}
                    </span>
                    {temFaixa && (
                      <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                        ✓ faixa disponível
                      </span>
                    )}
                  </div>
                  {item.musicaArtista && (
                    <p className="text-xs text-zinc-400 mt-0.5">{item.musicaArtista}</p>
                  )}
                </div>
                {item.musicaLinkVideo && (
                  <a
                    href={item.musicaLinkVideo}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-violet-500 hover:text-violet-700 shrink-0"
                  >
                    ▶ Vídeo
                  </a>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Player */}
      {itemAtivo && (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden sticky bottom-4 shadow-lg">

          {/* Cabeçalho */}
          <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-800 truncate">{itemAtivo.musicaTitulo}</p>
              {itemAtivo.cantorInfo?.tom && (
                <p className="text-xs text-zinc-400">Tom: {itemAtivo.cantorInfo.tom}</p>
              )}
            </div>
            {itemAtivo.musicaBpm && (
              <span className="text-xs text-zinc-400 shrink-0">🥁 {itemAtivo.musicaBpm} BPM</span>
            )}
          </div>

          {/* Seletor de faixas */}
          {(itemAtivo.cantorInfo?.faixas ?? []).length > 0 ? (
            <div className="px-5 py-3 border-b border-zinc-100 flex gap-2 flex-wrap">
              {(itemAtivo.cantorInfo?.faixas ?? []).map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleSelecionarFaixa(f)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    faixaAtiva?.id === f.id
                      ? "bg-violet-600 text-white border-violet-600"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  {f.instrumento}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-5 py-3 border-b border-zinc-100">
              <p className="text-xs text-zinc-400">Nenhuma faixa cadastrada para esta música.</p>
            </div>
          )}

          {/* Conteúdo do player */}
          {faixaAtiva && (
            <div className="p-5 space-y-4">

              {/* Google Drive — usa iframe de preview */}
              {isDrive && driveFileId ? (
                <div className="space-y-3">
                  <iframe
                    key={driveFileId}
                    src={drivePreviewUrl(driveFileId)}
                    className="w-full rounded-lg border border-zinc-200"
                    style={{ height: 80 }}
                    allow="autoplay"
                    title={faixaAtiva.instrumento}
                  />
                  {/* Controle de velocidade — aviso que o iframe não suporta */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-zinc-400">Velocidade:</span>
                    <div className="flex gap-1">
                      {VELOCIDADES.map((v) => (
                        <span
                          key={v}
                          className={`text-xs px-2 py-1 rounded ${
                            v === 1 ? "bg-violet-600 text-white" : "bg-zinc-100 text-zinc-400"
                          }`}
                        >
                          {v}×
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-zinc-400">
                      — controle de velocidade disponível no player do Drive
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 text-center">{faixaAtiva.instrumento}</p>
                </div>
              ) : (
                /* Link direto — usa <audio> nativo com controle de velocidade */
                <div className="space-y-3">
                  <audio
                    ref={audioRef}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => { setTocando(false); setProgresso(0) }}
                    onError={handleAudioError}
                  />

                  {erroAudio && (
                    <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-2">{erroAudio}</p>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400 w-10 text-right tabular-nums">
                      {formatarTempo(progresso)}
                    </span>
                    <input
                      type="range" min={0} max={duracao || 0} step={0.1} value={progresso}
                      onChange={handleSeek}
                      className="flex-1 h-1.5 rounded-full accent-violet-600 cursor-pointer"
                    />
                    <span className="text-xs text-zinc-400 w-10 tabular-nums">
                      {formatarTempo(duracao)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <button
                      onClick={handlePlayPause}
                      className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 transition-colors"
                    >
                      {tocando ? "⏸" : "▶"}
                    </button>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-zinc-400">Velocidade:</span>
                      {VELOCIDADES.map((v) => (
                        <button
                          key={v}
                          onClick={() => setVelocidade(v)}
                          className={`text-xs px-2 py-1 rounded transition-colors ${
                            velocidade === v
                              ? "bg-violet-600 text-white"
                              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                          }`}
                        >
                          {v}×
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 text-center">{faixaAtiva.instrumento}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}