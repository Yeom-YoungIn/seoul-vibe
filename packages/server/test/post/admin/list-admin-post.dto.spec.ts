import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ListAdminPostDto } from '../../../src/post/admin/dto/request/list-admin-post.dto';

describe('ListAdminPostDto', () => {
  it.each([
    ['true', true],
    ['false', false],
  ])('쿼리 문자열 %s를 boolean %s로 변환한다', async (raw, expected) => {
    const dto = plainToInstance(ListAdminPostDto, { isHidden: raw });
    expect(dto.isHidden).toBe(expected);
    expect(await validate(dto)).toHaveLength(0);
  });

  it('take가 100을 넘으면 거부한다', async () => {
    const dto = plainToInstance(ListAdminPostDto, { take: '101' });
    expect(await validate(dto)).not.toHaveLength(0);
  });
});
