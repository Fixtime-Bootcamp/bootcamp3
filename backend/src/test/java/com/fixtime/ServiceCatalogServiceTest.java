package com.fixtime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fixtime.exception.ResourceNotFoundException;
import com.fixtime.service.CreateServiceRequest;
import com.fixtime.service.ServiceCatalogService;
import com.fixtime.service.ServiceEntity;
import com.fixtime.service.ServiceRepository;
import com.fixtime.service.ServiceResponse;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

/**
 * Testes unitários para o ServiceCatalogService.
 * Valida os requisitos do catálogo de serviços (RF03) e regras de ativação (RN01) e duração (RN02).
 */
class ServiceCatalogServiceTest {

    private ServiceRepository repository;
    private ServiceCatalogService service;

    @BeforeEach
    void setUp() {
        repository = mock(ServiceRepository.class);
        service = new ServiceCatalogService(repository);
    }

    private ServiceEntity entity(Long id, boolean active) {
        ServiceEntity entity = new ServiceEntity("Formatacao", "Formatacao completa", 90, new BigDecimal("150.00"), active);
        entity.setId(id);
        return entity;
    }

    /**
     * Valida RF03 e RN02: Criação de serviço ativo preservando duração e preço informados.
     */
    @Test
    @DisplayName("Deve cadastrar servico ativo com sucesso")
    void createsService() {
        when(repository.save(any(ServiceEntity.class))).thenReturn(entity(1L, true));

        ServiceResponse response = service.create(
                new CreateServiceRequest("Formatacao", "Formatacao completa", 90, new BigDecimal("150.00")));

        ArgumentCaptor<ServiceEntity> captor = ArgumentCaptor.forClass(ServiceEntity.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().isActive()).isTrue();
        assertThat(captor.getValue().getDurationMinutes()).isEqualTo(90);
        assertThat(captor.getValue().getPrice()).isEqualByComparingTo("150.00");
        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.durationMinutes()).isEqualTo(90);
        assertThat(response.active()).isTrue();
    }

    /**
     * Valida RF03: Descrição é opcional no cadastro de serviço.
     */
    @Test
    @DisplayName("Deve cadastrar servico sem descricao")
    void createsServiceWithoutDescription() {
        ServiceEntity saved = new ServiceEntity("Limpeza", null, 30, BigDecimal.ZERO, true);
        saved.setId(2L);
        when(repository.save(any(ServiceEntity.class))).thenReturn(saved);

        ServiceResponse response = service.create(new CreateServiceRequest("Limpeza", null, 30, BigDecimal.ZERO));

        assertThat(response.description()).isNull();
        assertThat(response.price()).isEqualByComparingTo("0");
    }

    /**
     * Valida RF03: Listagem de todos os serviços do catálogo.
     */
    @Test
    @DisplayName("Deve listar todos os servicos")
    void listsAllServices() {
        when(repository.findAll()).thenReturn(List.of(entity(1L, true), entity(2L, false)));

        List<ServiceResponse> responses = service.listAll();

        assertThat(responses).extracting(ServiceResponse::id).containsExactly(1L, 2L);
        assertThat(responses).extracting(ServiceResponse::active).containsExactly(true, false);
    }

    /**
     * Valida RF03: Listagem vazia quando o catálogo não possui serviços.
     */
    @Test
    @DisplayName("Deve retornar lista vazia quando nao ha servicos")
    void listsNoServices() {
        when(repository.findAll()).thenReturn(List.of());

        assertThat(service.listAll()).isEmpty();
    }

    /**
     * Valida RN01: Inativação de serviço ativo.
     */
    @Test
    @DisplayName("Deve inativar servico ativo")
    void deactivatesService() {
        ServiceEntity active = entity(1L, true);
        when(repository.findById(1L)).thenReturn(Optional.of(active));
        when(repository.save(active)).thenReturn(active);

        assertThat(service.toggleActive(1L).active()).isFalse();
        verify(repository).save(active);
    }

    /**
     * Valida RN01: Reativação de serviço inativo.
     */
    @Test
    @DisplayName("Deve reativar servico inativo")
    void reactivatesService() {
        ServiceEntity inactive = entity(1L, false);
        when(repository.findById(1L)).thenReturn(Optional.of(inactive));
        when(repository.save(inactive)).thenReturn(inactive);

        assertThat(service.toggleActive(1L).active()).isTrue();
    }

    /**
     * Valida RNF03: Alternar status de serviço inexistente lança ResourceNotFoundException sem persistir.
     */
    @Test
    @DisplayName("Deve lancar excecao ao alternar status de servico inexistente")
    void throwsOnToggleMissingService() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.toggleActive(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("ID 99");
        verify(repository, never()).save(any(ServiceEntity.class));
    }

    /**
     * Valida RN01: Retorno do serviço ativo para cálculo da duração do agendamento.
     */
    @Test
    @DisplayName("Deve retornar servico ativo")
    void returnsActiveService() {
        ServiceEntity active = entity(1L, true);
        when(repository.findById(1L)).thenReturn(Optional.of(active));

        assertThat(service.getActiveServiceOrThrow(1L)).isSameAs(active);
    }

    /**
     * Valida RNF03: Busca de serviço inexistente lança ResourceNotFoundException.
     */
    @Test
    @DisplayName("Deve lancar excecao ao buscar servico inexistente")
    void throwsOnMissingService() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getActiveServiceOrThrow(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("ID 99");
    }

    /**
     * Valida RN01: Serviço inativo não pode ser usado em novo agendamento.
     */
    @Test
    @DisplayName("Deve lancar excecao ao buscar servico inativo")
    void throwsOnInactiveService() {
        when(repository.findById(2L)).thenReturn(Optional.of(entity(2L, false)));

        assertThatThrownBy(() -> service.getActiveServiceOrThrow(2L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("inativo");
    }
}
