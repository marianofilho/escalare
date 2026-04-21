// src/services/solicitacao.service.ts
import type { SolicitacaoRepository } from "@/repositories/solicitacao.repository"
import type { MusicaRepository } from "@/repositories/musica.repository"
import type { MembroRepository } from "@/repositories/membro.repository"
import type { CriarSolicitacaoDto, AprovarSolicitacaoDto } from "@/dtos/solicitacao/solicitacao.dto"
import { NaoEncontradoError, AcessoNegadoError } from "@/types/errors"
import { CantorJaVinculadoError, PerfilInvalidoParaCantorError } from "@/types/musica-errors"

export class SolicitacaoJaExisteError extends Error {
  constructor() {
    super("Voce ja possui uma solicitacao pendente ou aprovada para esta musica")
    this.name = "SolicitacaoJaExisteError"
  }
}

export class SolicitacaoService {
  constructor(
    private readonly solicitacaoRepository: SolicitacaoRepository,
    private readonly musicaRepository: MusicaRepository,
    private readonly membroRepository: MembroRepository
  ) {}

  // Cantor solicita vínculo com uma música
  async solicitar(
    dto: CriarSolicitacaoDto,
    cantorId: string,
    igrejaId: string
  ) {
    // Valida que o solicitante é cantor
    const cantor = await this.membroRepository.findById(cantorId, igrejaId)
    if (!cantor) throw new NaoEncontradoError("Membro", cantorId)
    if (cantor.perfil !== "CANTOR") throw new PerfilInvalidoParaCantorError()

    // Valida que a música existe na igreja
    const musica = await this.musicaRepository.findById(dto.musicaId, igrejaId)
    if (!musica) throw new NaoEncontradoError("Musica", dto.musicaId)

    // Impede se já existe vínculo ativo
    const vinculo = await this.musicaRepository.findVinculo(dto.musicaId, cantorId)
    if (vinculo) throw new CantorJaVinculadoError()

    // Impede solicitação duplicada
    const existente = await this.solicitacaoRepository.findPorMusicaCantor(dto.musicaId, cantorId)
    if (existente) throw new SolicitacaoJaExisteError()

    return this.solicitacaoRepository.criar(igrejaId, dto.musicaId, cantorId, dto.tomSugerido)
  }

  // Admin lista solicitações pendentes
  async listarPendentes(igrejaId: string, adminId: string) {
    const admin = await this.membroRepository.findById(adminId, igrejaId)
    if (!admin || admin.perfil !== "ADMINISTRADOR") throw new AcessoNegadoError()
    return this.solicitacaoRepository.listarPendentes(igrejaId)
  }

  // Cantor lista suas próprias solicitações
  async listarMinhas(cantorId: string, igrejaId: string) {
    return this.solicitacaoRepository.listarPorCantor(cantorId, igrejaId)
  }

  // Contagem de pendentes para o badge
  async contarPendentes(igrejaId: string): Promise<number> {
    return this.solicitacaoRepository.contarPendentes(igrejaId)
  }

  // Admin aprova — cria o vínculo e marca como aprovada
  async aprovar(
    solicitacaoId: string,
    dto: AprovarSolicitacaoDto,
    adminId: string,
    igrejaId: string
  ) {
    const admin = await this.membroRepository.findById(adminId, igrejaId)
    if (!admin || admin.perfil !== "ADMINISTRADOR") throw new AcessoNegadoError()

    const solicitacao = await this.solicitacaoRepository.findById(solicitacaoId)
    if (!solicitacao) throw new NaoEncontradoError("Solicitacao", solicitacaoId)

    // Verifica se ainda não existe vínculo (pode ter sido criado manualmente)
    const vinculo = await this.musicaRepository.findVinculo(
      solicitacao.musicaId,
      solicitacao.cantorId
    )
    if (vinculo) throw new CantorJaVinculadoError()

    // Cria o vínculo com o tom definido pelo admin
    await this.musicaRepository.vincularCantor(solicitacao.musicaId, {
      cantorId: solicitacao.cantorId,
      tom: dto.tom,
    })

    // Marca solicitação como aprovada
    await this.solicitacaoRepository.aprovar(solicitacaoId)

    return { ok: true }
  }

  // Admin recusa
  async recusar(solicitacaoId: string, adminId: string, igrejaId: string) {
    const admin = await this.membroRepository.findById(adminId, igrejaId)
    if (!admin || admin.perfil !== "ADMINISTRADOR") throw new AcessoNegadoError()

    const solicitacao = await this.solicitacaoRepository.findById(solicitacaoId)
    if (!solicitacao) throw new NaoEncontradoError("Solicitacao", solicitacaoId)

    await this.solicitacaoRepository.recusar(solicitacaoId)
    return { ok: true }
  }
}