package com.fixtime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fixtime.exception.ResourceNotFoundException;
import com.fixtime.technician.CreateTechnicianRequest;
import com.fixtime.technician.Technician;
import com.fixtime.technician.TechnicianRepository;
import com.fixtime.technician.TechnicianResponse;
import com.fixtime.technician.TechnicianService;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

/**
 * Testes unitários para o TechnicianService.
 * Valida os requisitos de gestão de técnicos (RF02) e regras de ativação para agendamento (RN01).
 */
class TechnicianServiceTest {

    private TechnicianRepository repository;
    private TechnicianService service;

    @BeforeEach
    void setUp() {
        repository = mock(TechnicianRepository.class);
        service = new TechnicianService(repository);
    }

    /**
     * Valida RF02: Criação de técnico sempre ativo, com os dados informados.
     */
    @Test
    @DisplayName("Deve cadastrar tecnico ativo com sucesso")
    void createsTechnician() {
        Technician saved = new Technician("Joao", "joao@teste.com", "11988880000", true);
        saved.setId(1L);
        when(repository.save(any(Technician.class))).thenReturn(saved);

        TechnicianResponse response = service.create(new CreateTechnicianRequest("Joao", "joao@teste.com", "11988880000"));

        ArgumentCaptor<Technician> captor = ArgumentCaptor.forClass(Technician.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().isActive()).isTrue();
        assertThat(captor.getValue().getEmail()).isEqualTo("joao@teste.com");
        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.name()).isEqualTo("Joao");
        assertThat(response.active()).isTrue();
    }

    /**
     * Valida RF02: Listagem de todos os técnicos cadastrados.
     */
    @Test
    @DisplayName("Deve listar todos os tecnicos")
    void listsAllTechnicians() {
        Technician first = new Technician("Joao", "joao@teste.com", "11988880000", true);
        first.setId(1L);
        Technician second = new Technician("Ana", "ana@teste.com", "11988880001", false);
        second.setId(2L);
        when(repository.findAll()).thenReturn(List.of(first, second));

        List<TechnicianResponse> responses = service.listAll();

        assertThat(responses).extracting(TechnicianResponse::name).containsExactly("Joao", "Ana");
        assertThat(responses).extracting(TechnicianResponse::active).containsExactly(true, false);
    }

    /**
     * Valida RF02: Listagem vazia quando não há técnicos cadastrados.
     */
    @Test
    @DisplayName("Deve retornar lista vazia quando nao ha tecnicos")
    void listsNoTechnicians() {
        when(repository.findAll()).thenReturn(List.of());

        assertThat(service.listAll()).isEmpty();
    }

    /**
     * Valida RN01: Inativação de técnico ativo.
     */
    @Test
    @DisplayName("Deve inativar tecnico ativo")
    void deactivatesTechnician() {
        Technician active = new Technician("Joao", "joao@teste.com", "11988880000", true);
        active.setId(1L);
        when(repository.findById(1L)).thenReturn(Optional.of(active));
        when(repository.save(active)).thenReturn(active);

        assertThat(service.toggleActive(1L).active()).isFalse();
        verify(repository).save(active);
    }

    /**
     * Valida RN01: Reativação de técnico inativo.
     */
    @Test
    @DisplayName("Deve reativar tecnico inativo")
    void reactivatesTechnician() {
        Technician inactive = new Technician("Joao", "joao@teste.com", "11988880000", false);
        inactive.setId(1L);
        when(repository.findById(1L)).thenReturn(Optional.of(inactive));
        when(repository.save(inactive)).thenReturn(inactive);

        assertThat(service.toggleActive(1L).active()).isTrue();
    }

    /**
     * Valida RNF03: Alternar status de técnico inexistente lança ResourceNotFoundException sem persistir.
     */
    @Test
    @DisplayName("Deve lancar excecao ao alternar status de tecnico inexistente")
    void throwsOnToggleMissingTechnician() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.toggleActive(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("ID 99");
        verify(repository, never()).save(any(Technician.class));
    }

    /**
     * Valida RN01: Retorno do técnico ativo para uso no agendamento.
     */
    @Test
    @DisplayName("Deve retornar tecnico ativo")
    void returnsActiveTechnician() {
        Technician active = new Technician("Joao", "joao@teste.com", "11988880000", true);
        active.setId(1L);
        when(repository.findById(1L)).thenReturn(Optional.of(active));

        assertThat(service.getActiveTechnicianOrThrow(1L)).isSameAs(active);
    }

    /**
     * Valida RNF03: Busca de técnico inexistente lança ResourceNotFoundException.
     */
    @Test
    @DisplayName("Deve lancar excecao ao buscar tecnico inexistente")
    void throwsOnMissingTechnician() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getActiveTechnicianOrThrow(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("ID 99");
    }

    /**
     * Valida RN01: Técnico inativo não pode ser usado em novo agendamento.
     */
    @Test
    @DisplayName("Deve lancar excecao ao buscar tecnico inativo")
    void throwsOnInactiveTechnician() {
        Technician inactive = new Technician("Joao", "joao@teste.com", "11988880000", false);
        inactive.setId(2L);
        when(repository.findById(2L)).thenReturn(Optional.of(inactive));

        assertThatThrownBy(() -> service.getActiveTechnicianOrThrow(2L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("inativo");
    }
}
